import { connect } from '@holochain/hc-web-client';
import { Blackboard } from '../blackboard/blackboard';
import { Playground } from '../state/playground';
import { Conductor } from '../types/conductor';
import { hookUpConductors } from './message';
import { Header } from '../types/header';
import { hash } from './hash';
import { Entry, EntryType } from '../types/entry';
import { CellContents, Cell } from '../types/cell';
import { entryToDHTOps, hashDHTOp } from '../types/dht-op';

export function checkConnection(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onerror = () => reject();
    ws.onopen = () => {
      connect({ url, wsClient: ws })
        .then(({ call }) => {
          call('debug/running_instances')({})
            .then(() => resolve())
            .catch(() => reject());
        })
        .catch(reject);
    };
  });
}

const globalCAS = {};

export async function connectToConductors(
  blackboard: Blackboard<Playground>,
  conductorsUrls: string[]
): Promise<void> {
  const initialPlayground: Playground = {
    activeAgentId: null,
    activeDNA: null,
    activeEntryId: null,
    conductors: [],
    redundancyFactor: 1,
    conductorsUrls,
  };

  const promises = conductorsUrls.map(async (url) => {
    const { onSignal, call } = await connect({ url });

    const contents = await getCellContents(call);

    const agentIds = contents.map((c) => c.agentId);

    const conductor = new Conductor(undefined, {
      agentIds,
    });

    for (const content of contents) {
      const cell = Cell.from(conductor, content);
      conductor.cells[cell.dna] = cell;
      cell.updateDHTShard();
    }

    onSignal(async (params) => {
      if (!params.instance_id) return;
      const stateDump = await call('debug/state_dump')({
        instance_id: params.instance_id,
        source_chain: true,
        held_aspects: true,
        queued_holding_workflows: false,
      });
      const cellContent = await processStateDump(
        call,
        params.instance_id,
        stateDump
      );

      const conductorIndex = initialPlayground.conductors.findIndex((c) =>
        c.agentIds.includes(cellContent.agentId)
      );
      const conductor = initialPlayground.conductors[conductorIndex];
      const cell = Cell.from(conductor, cellContent);
      conductor.cells[cell.dna] = cell;
      cell.updateDHTShard();
      blackboard.update('conductors', initialPlayground.conductors);
    });

    return conductor;
  });

  initialPlayground.conductors = await Promise.all(promises);

  initialPlayground.activeDNA = Object.keys(
    initialPlayground.conductors[0].cells
  )[0];

  hookUpConductors(initialPlayground.conductors);

  blackboard.updateState(initialPlayground);
  console.log(initialPlayground.conductors);
}

export async function getCellContents(call): Promise<Array<CellContents>> {
  const instancesIds: Array<string> = await call('debug/running_instances')({});

  const promises = instancesIds.map((id) => getCellContent(call, id));
  return Promise.all(promises);
}

export async function fetchCas(
  call,
  instance_id: string,
  address: string
): Promise<any> {
  if (globalCAS[address]) return globalCAS[address];
  const casResult = await call('debug/fetch_cas')({
    instance_id,
    address: address,
  });
  globalCAS[address] = casResult;
  return casResult;
}

export async function getCellContent(
  call,
  instance_id: string
): Promise<CellContents> {
  const stateDump = await call('debug/state_dump')({
    instance_id,
    source_chain: true,
    held_aspects: true,
    queued_holding_workflows: false,
  });
  console.log(stateDump);

  const cellContent = await processStateDump(call, instance_id, stateDump);
  return cellContent;
}

export async function processStateDump(
  call,
  instanceId: string,
  stateDump: any
): Promise<CellContents> {
  const CAS = {};
  const dna = stateDump.source_chain[0].entry_address;
  const agentId = stateDump.source_chain[1].entry_address;

  const promises = stateDump.source_chain.map(async (header) => {
    CAS[hash(header)] = processHeader(header);

    const casResult = await fetchCas(call, instanceId, header.entry_address);

    CAS[header.entry_address] = processEntry(dna, agentId, casResult);
  });

  const aspects = Object.keys(stateDump.held_aspects);

  const dhtPromises = aspects.map(async (aspect) => {
    const op = await fetchCas(call, instanceId, aspect);

    if (op.type !== 'UNKNOWN') return [];
    const headerAspect = JSON.parse(op.content);
    const header = processHeader(headerAspect);
    const entry = await fetchCas(call, instanceId, header.entry_address);

    const ops = entryToDHTOps(processEntry(dna, agentId, entry), header);
    return ops;
  });

  const dhtOps = await Promise.all(dhtPromises);

  const DHTOpTransforms = {};

  for (const dhtOp of [].concat(...dhtOps)) {
    DHTOpTransforms[hashDHTOp(dhtOp)] = dhtOp;
  }

  const sourceChain = stateDump.source_chain.map(hash);

  await Promise.all(promises);

  return {
    CAS,
    dna,
    agentId,
    peers: [],
    redundancyFactor: 0,
    sourceChain: sourceChain,
    CASMeta: {},
    DHTOpTransforms,
  };
}

export function processHeader(header: any): Header {
  return {
    agent_id: header.provenances[0][0],
    entry_address: header.entry_address,
    last_header_address: header.link,
    timestamp: Math.floor(new Date(header.timestamp).getTime() / 1000),
    replaced_entry_address: header.link_update_delete,
  };
}

export function processEntry(dna: string, agent_id: string, entry: any): Entry {
  switch (entry.type) {
    case '%dna':
      return {
        type: EntryType.DNA,
        payload: dna,
      };
    case '%agent_id':
      return {
        type: EntryType.AgentId,
        payload: agent_id,
      };
    case '%cap_token_grant':
      return {
        type: EntryType.CapTokenGrant,
        payload: JSON.parse(entry.content).CapTokenGrant,
      };
    case '%link_add':
      return {
        type: EntryType.LinkAdd,
        payload: processLinkContent(entry.content),
      };
    default:
      return {
        type: EntryType.CreateEntry,
        payload: {
          type: entry.type,
          content: JSON.parse(entry.content),
        },
      };
  }
}

export function processLinkContent(
  link: string
): { base: string; target: string; type: string; tag: string } {
  const parsed = link.split(')');
  const typeTag = parsed[0].trim().split('#');
  const baseTarget = parsed[1].split('=>');
  return {
    base: baseTarget[0].trim(),
    target: baseTarget[1].trim(),
    type: typeTag[0].substring(1),
    tag: typeTag[1],
  };
}
