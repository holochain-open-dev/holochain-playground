import { connect } from "@holochain/hc-web-client";
import { Blackboard } from "../blackboard/blackboard";
import { Playground } from "../state/playground";
import { Conductor } from "../types/conductor";
import { hookUpConductors } from "./message";
import { Header } from "../types/header";
import { hash } from "./hash";
import { Entry, EntryType } from "../types/entry";
import { CellContents, Cell } from "../types/cell";
import { Dictionary } from "../types/common";
import { entryToDHTOps, hashDHTOp } from "../types/dht-op";

export async function connectToConductors(
  blackboard: Blackboard<Playground>,
  conductorsUrls: string[]
): Promise<void> {
  const globalCAS = {};

  const initialPlayground: Playground = {
    activeAgentId: null,
    activeDNA: null,
    activeEntryId: null,
    conductors: [],
    redundancyFactor: undefined,
  };

  const promises = conductorsUrls.map(async (url) => {
    const { onSignal, call } = await connect({ url });
    const result = await call("debug/running_instances")({});
    const instance_id = result[0];
    const stateDump = await call("debug/state_dump")({
      instance_id,
      source_chain: true,
      held_aspects: true,
      queued_holding_workflows: false,
    });

    const fetchCas = async (address) => {
      if (globalCAS[address]) return globalCAS[address];
      const casResult = await call("debug/fetch_cas")({
        instance_id,
        address: address,
      });
      globalCAS[address] = casResult;
      return casResult;
    };

    const cellContent = await processStateDump(stateDump, fetchCas);

    const conductor = new Conductor(undefined, {
      agentIds: [cellContent.agentId],
    });
    const cell = Cell.from(conductor, cellContent);
    conductor.cells[cell.dna] = cell;

    return conductor;
  });

  initialPlayground.conductors = await Promise.all(promises);

  initialPlayground.activeDNA = Object.keys(
    initialPlayground.conductors[0].cells
  )[0];

  hookUpConductors(initialPlayground.conductors);

  console.log("hi", initialPlayground);

  blackboard.updateState(initialPlayground);
}

export async function processStateDump(
  stateDump: any,
  fetchCas: (address: string) => Promise<any>
): Promise<CellContents> {
  const CAS = {};
  const dna = stateDump.source_chain[0].entry_address;
  const agentId = stateDump.source_chain[1].entry_address;

  const promises = stateDump.source_chain.map(async (header) => {
    CAS[hash(header)] = processHeader(header);

    const casResult = await fetchCas(header.entry_address);

    CAS[header.entry_address] = processEntry(dna, agentId, casResult);
  });
  console.log(stateDump);

  const aspects = Object.keys(stateDump.held_aspects);

  const dhtPromises = aspects.map(async (aspect) => {
    const op = await fetchCas(aspect);

    if (op.type !== "UNKNOWN") return [];
    const headerAspect = JSON.parse(op.content);
    const header = processHeader(headerAspect);
    const entry = await fetchCas(header.entry_address);

    const ops = entryToDHTOps(entry, header);
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
    timestamp: new Date(header.timestamp).getTime(),
    replaced_entry_address: undefined,
  };
}

export function processEntry(dna: string, agent_id: string, entry: any): Entry {
  switch (entry.type) {
    case "%dna":
      return {
        type: EntryType.DNA,
        payload: dna,
      };
    case "%agent_id":
      return {
        type: EntryType.AgentId,
        payload: agent_id,
      };
    case "%cap_token_grant":
      return {
        type: EntryType.CapTokenGrant,
        payload: entry.content,
      };
    case "%link_add":
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
  const parsed = link.split(")");
  const typeTag = parsed[0].trim().split("#");
  const baseTarget = parsed[1].split("=>");
  return {
    base: baseTarget[0].trim(),
    target: baseTarget[1].trim(),
    type: typeTag[0].substring(1),
    tag: typeTag[1],
  };
}
