import { hash } from '../processors/hash';

export interface EntryContent<E extends EntryType, P> {
  type: E;
  payload: P;
}

export type Entry =
  | EntryContent<EntryType.DNA, string>
  | EntryContent<EntryType.AgentId, string>
  | EntryContent<EntryType.CreateEntry, { content: any; type: string }>
  | EntryContent<EntryType.RemoveEntry, { deletedEntry: string }>
  | EntryContent<
      EntryType.LinkAdd,
      { base: string; target: string; type: string; tag: string }
    >
  | EntryContent<
      EntryType.LinkRemove,
      { base: string; target: string; type: string; timestamp: number }
    >
  | EntryContent<EntryType.CapTokenGrant, any>
  | EntryContent<EntryType.CapTokenClaim, any>;

export enum EntryType {
  DNA = 'DNA',
  AgentId = 'AgentId',
  CreateEntry = 'CreateEntry',
  RemoveEntry = 'RemoveEntry',
  LinkAdd = 'LinkAdd',
  LinkRemove = 'LinkRemove',
  CapTokenGrant = 'CapTokenGrant',
  CapTokenClaim = 'CapTokenClaim',
}

export async function hashEntry(entry: Entry): Promise<string> {
  if (entry.type === EntryType.AgentId) return entry.payload;
  return hash(entry);
}
