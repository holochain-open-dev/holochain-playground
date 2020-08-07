import { Dictionary } from './common';
import {
  DHTOp,
  entryToDHTOps,
  neighborhood,
  DHTOpType,
  hashDHTOp,
  sortDHTOps,
} from './dht-op';
import { Entry, EntryType, hashEntry } from './entry';
import { hash, distance, compareBigInts } from '../processors/hash';
import { Header } from './header';
import { NetworkMessageType, NetworkMessage, SendMessage } from './network';
import { Conductor } from './conductor';

export const AGENT_HEADERS = 'AGENT_HEADERS';
export const CRUDStatus = 'CRUDStatus';
export const REPLACES = 'REPLACES';
export const REPLACED_BY = 'REPLACED_BY';
export const DELETED_BY = 'DELETED_BY';
export const HEADERS = 'HEADERS';
export const LINKS_TO = 'LINKS_TO';

export interface EntryMetadata {
  CRUDStatus: string;
  REPLACES: string | undefined;
  REPLACED_BY: string | undefined;
  DELETED_BY: string | undefined;
  HEADERS: Dictionary<Header>;
  LINKS_TO: Array<{
    target: string;
    tag: string;
    type: string;
    timestamp: string;
  }>;
  AGENT_HEADERS?: Dictionary<Header>;
}

export interface CASMetadata {
  CRUDStatus: string;
  REPLACES: string | undefined;
  REPLACED_BY: string[];
  DELETED_BY: string | undefined;
  HEADERS: string[];
  LINKS_TO: Array<{
    target: string;
    tag: string;
    type: string;
    timestamp: number;
  }>;
  AGENT_HEADERS?: string[];
}

export interface CellContents {
  dna: string;
  agentId: string;
  redundancyFactor: number;
  peers: string[];
  sourceChain: string[];
  CAS: Dictionary<any>;
  CASMeta: Dictionary<CASMetadata>; // For the moment only DHT shard
  DHTOpTransforms: Dictionary<DHTOp>;
}

export class Cell {
  sourceChain: string[] = [];
  CAS: Dictionary<any> = {};
  CASMeta: Dictionary<CASMetadata> = {}; // For the moment only DHT shard
  DHTOpTransforms: Dictionary<DHTOp> = {};

  constructor(
    public conductor: Conductor,
    public dna: string,
    public agentId: string,
    public redundancyFactor: number,
    public peers: string[]
  ) {}

  static from(conductor: Conductor, contents: CellContents) {
    const cell = new Cell(
      conductor,
      contents.dna,
      contents.agentId,
      contents.redundancyFactor,
      contents.peers
    );
    cell.sourceChain = contents.sourceChain;
    cell.CAS = contents.CAS;
    cell.CASMeta = contents.CASMeta;
    cell.DHTOpTransforms = contents.DHTOpTransforms;
    return cell;
  }

  toContents(): CellContents {
    return {
      CAS: this.CAS,
      CASMeta: this.CASMeta,
      DHTOpTransforms: this.DHTOpTransforms,
      agentId: this.agentId,
      dna: this.dna,
      peers: this.peers,
      redundancyFactor: this.redundancyFactor,
      sourceChain: this.sourceChain,
    };
  }

  async init() {
    await this.createEntry(
      { type: EntryType.DNA, payload: this.dna },
      undefined
    );
    await this.createEntry(
      { type: EntryType.AgentId, payload: this.agentId },
      undefined
    );
  }

  async createEntry(entry: Entry, replaces: string | undefined) {
    const entryId = await hashEntry(entry);

    this.CAS[entryId] = entry;

    const header = await this.createHeader(entryId, replaces);
    this.publishEntry(entry, header);
  }

  async publishEntry(entry: Entry, header: Header) {
    const dhtOps = await entryToDHTOps(entry, header);

    this.fastPush(dhtOps);
  }

  republish() {
    for (const headerId of this.sourceChain) {
      const header: Header = this.CAS[headerId];
      const entry: Entry = this.CAS[header.entry_address];
      this.publishEntry(entry, header);
    }
  }

  async fastPush(dhtOps: DHTOp[]): Promise<void> {
    for (const dhtOp of dhtOps) {
      const hood = await neighborhood(dhtOp);
      const dhtOpId = await hashDHTOp(dhtOp);
      const message: NetworkMessage = {
        type: NetworkMessageType.Publish,
        payload: {
          dhtOp,
          dhtOpId,
        },
      };

      const peers = this.getNPeersClosestTo(this.redundancyFactor, hood);

      for (const peer of peers) {
        this.conductor.sendMessage(this.dna, this.agentId, peer, message);
      }
    }
  }

  getEntry(hash: string): Entry | undefined {
    const peer = this.getNPeersClosestTo(1, hash);

    const message: NetworkMessage = {
      type: NetworkMessageType.GetEntry,
      payload: hash,
    };

    return this.conductor.sendMessage(this.dna, this.agentId, peer[0], message);
  }

  getDHTShard(): Dictionary<EntryMetadata> {
    const dhtShard = {};

    for (const hash of Object.keys(this.CASMeta)) {
      const entryMetadata = this.getEntryMetadata(hash);
      dhtShard[hash] = {
        entry: this.CAS[hash],
        metadata: entryMetadata,
      };
    }

    return dhtShard;
  }

  getEntryMetadata(hash: string): EntryMetadata | undefined {
    const processHeaders = (headerAddresses: string[]) =>
      headerAddresses.reduce(
        (acc, next) => ({ ...acc, [next]: this.CAS[next] as Header }),
        {} as Dictionary<Header>
      );

    if (!this.CASMeta[hash]) return undefined;
    const metadata: CASMetadata = { ...this.CASMeta[hash] };

    if (metadata[AGENT_HEADERS]) {
      ((metadata as unknown) as EntryMetadata)[AGENT_HEADERS] = processHeaders(
        metadata[AGENT_HEADERS]
      );
    }

    if (metadata[HEADERS]) {
      ((metadata as unknown) as EntryMetadata)[HEADERS] = processHeaders(
        metadata[HEADERS]
      );
    }

    return (metadata as unknown) as EntryMetadata;
  }

  getNeighbors(): string[] {
    const sortedPeers = this.peers.sort((agentA: string, agentB: string) => {
      const distanceA = distance(this.agentId, agentA);
      const ditsanceB = distance(this.agentId, agentB);
      return compareBigInts(distanceA, ditsanceB);
    });

    const neighbors = sortedPeers.slice(0, 4);

    if (sortedPeers.length > 4) {
      const half = Math.floor(this.peers.length / 2);
      neighbors.push(sortedPeers[half]);
    }
    if (sortedPeers.length > 8) {
      const prehalf = Math.floor(this.peers.length * 0.35);
      neighbors.push(sortedPeers[prehalf]);
      const posthalf = Math.floor(this.peers.length * 0.65);
      neighbors.push(sortedPeers[posthalf]);
    }

    return neighbors;
  }

  getNPeersClosestTo(n: number, hash: string): string[] {
    const sortedPeers = [this.agentId, ...this.peers].sort(
      (agentA: string, agentB: string) => {
        const distanceA = distance(hash, agentA);
        const distanceB = distance(hash, agentB);
        return compareBigInts(distanceA, distanceB);
      }
    );

    return sortedPeers.slice(0, n);
  }

  newHeader(entryId: string, replacedEntryAddress: string | undefined): Header {
    const lastHeaderAddress =
      this.sourceChain.length > 0
        ? this.sourceChain[this.sourceChain.length - 1]
        : undefined;

    return {
      agent_id: this.agentId,
      entry_address: entryId,
      replaced_entry_address: replacedEntryAddress,
      timestamp: Math.floor(Date.now() / 1000),
      last_header_address: lastHeaderAddress,
    };
  }

  async createHeader(
    entryId: string,
    replacedEntryAddress: string | undefined
  ): Promise<Header> {
    const header = this.newHeader(entryId, replacedEntryAddress);
    const headerId = await hash(header);

    this.CAS[headerId] = header;
    this.sourceChain.push(headerId);

    return header;
  }

  initDHTShardForEntry(entryHash: string) {
    if (!this.CASMeta[entryHash]) {
      this.CASMeta[entryHash] = {
        HEADERS: [],
        LINKS_TO: [],
        CRUDStatus: undefined,
        REPLACED_BY: undefined,
        REPLACES: undefined,
        DELETED_BY: undefined,
      };
    }
  }

  updateDHTShard() {
    this.CASMeta = {};

    const dhtOps = Object.values(this.DHTOpTransforms);

    for (const dhtOp of sortDHTOps(dhtOps)) {
      const header = dhtOp.header;
      const headerHash = dhtOp.headerId;
      this.CAS[headerHash] = header;
      const entryHash = dhtOp.header.entry_address;

      switch (dhtOp.type) {
        case DHTOpType.RegisterAgentActivity:
          this.initDHTShardForEntry(dhtOp.header.agent_id);

          if (!this.CASMeta[dhtOp.header.agent_id][AGENT_HEADERS]) {
            this.CASMeta[dhtOp.header.agent_id][AGENT_HEADERS] = [];
          }

          this.CASMeta[dhtOp.header.agent_id][AGENT_HEADERS].push(headerHash);
          break;
        case DHTOpType.StoreEntry:
          this.CAS[entryHash] = dhtOp.entry;

          this.initDHTShardForEntry(entryHash);

          this.CASMeta[entryHash][CRUDStatus] = 'Live';

          if (dhtOp.header.replaced_entry_address) {
            this.CASMeta[entryHash][REPLACES] =
              dhtOp.header.replaced_entry_address;
          }

          if (!this.CASMeta[entryHash][HEADERS]) {
            this.CASMeta[entryHash][HEADERS] = [];
          }
          this.CASMeta[entryHash][HEADERS].push(headerHash);
          break;
        case DHTOpType.RegisterUpdatedTo:
          this.initDHTShardForEntry(header.replaced_entry_address);

          if (
            !this.CASMeta[header.replaced_entry_address][CRUDStatus] ||
            this.CASMeta[header.replaced_entry_address][CRUDStatus] !== 'Dead'
          ) {
            this.CASMeta[header.replaced_entry_address][CRUDStatus] = 'Dead';
            this.CASMeta[header.replaced_entry_address][REPLACED_BY] = [
              entryHash,
            ];
          } else {
            let replacedBy = this.CASMeta[header.replaced_entry_address][
              REPLACED_BY
            ];
            this.CASMeta[header.replaced_entry_address][CRUDStatus] =
              'CONFLICT';
            replacedBy.push(entryHash);
            this.CASMeta[header.replaced_entry_address][
              REPLACED_BY
            ] = replacedBy;
          }

          break;
        case DHTOpType.RegisterDeletedBy:
          const deletedEntryHash = dhtOp.entry.payload.deletedEntry;

          this.initDHTShardForEntry(deletedEntryHash);

          this.CASMeta[deletedEntryHash][CRUDStatus] = 'Dead';
          this.CASMeta[deletedEntryHash][REPLACED_BY] = undefined;
          this.CASMeta[deletedEntryHash][DELETED_BY] = header.entry_address;

          break;
        case DHTOpType.RegisterAddLink:
          this.initDHTShardForEntry(dhtOp.entry.payload.base);

          this.CASMeta[dhtOp.entry.payload.base][LINKS_TO].push({
            target: dhtOp.entry.payload.target,
            tag: dhtOp.entry.payload.tag,
            type: dhtOp.entry.payload.type,
            timestamp: dhtOp.header.timestamp,
          });
          break;
        case DHTOpType.RegisterRemoveLink:
          this.initDHTShardForEntry(dhtOp.entry.payload.base);

          const linkIndex = (this.CASMeta[dhtOp.entry.payload.base][
            LINKS_TO
          ] as Array<any>).findIndex(
            (link) =>
              link.type === dhtOp.entry.payload.type &&
              link.target === dhtOp.entry.payload.target &&
              link.timestamp === dhtOp.entry.payload.timestamp
          );
          (this.CASMeta[dhtOp.entry.payload.base][LINKS_TO] as Array<
            any
          >).splice(linkIndex, 1);
          break;
      }
    }
  }

  /** Network */

  handleNetworkMessage(fromAgentId: string, message: NetworkMessage): any {
    switch (message.type) {
      case NetworkMessageType.Publish:
        return this.handlePublishRequest(
          message.payload.dhtOpId,
          message.payload.dhtOp
        );
      case NetworkMessageType.GetEntry:
        return this.CAS[message.payload];
    }
  }

  joinNetwork() {}

  handlePublishRequest(hash: string, dhtOp: DHTOp) {
    if (this.DHTOpTransforms[hash]) return;

    this.DHTOpTransforms[hash] = dhtOp;

    this.updateDHTShard();
  }
}
