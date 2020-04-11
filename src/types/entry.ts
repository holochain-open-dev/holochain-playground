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
    >;

export enum EntryType {
  DNA = "DNA",
  AgentId = "AgentId",
  CreateEntry = "CreateEntry",
  RemoveEntry = "RemoveEntry",
  LinkAdd = "LinkAdd",
  LinkRemove = "LinkRemove",
  CapTokenGrant = "CapTokenGrant",
  CapTokenClaim = "CapTokenClaim",
}
