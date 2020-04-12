import { Header } from "./header";
import { Entry, EntryType, EntryContent } from "./entry";
import { hash } from "../processors/hash";

export enum DHTOpType {
  StoreHeader = "StoreHeader",
  StoreEntry = "StoreEntry",
  RegisterAgentActivity = "RegisterAgentActivity",
  RegisterUpdatedTo = "RegisterUpdatedTo",
  RegisterDeletedBy = "RegisterDeletedBy",
  RegisterAddLink = "RegisterAddLink",
  RegisterRemoveLink = "RegisterRemoveLink"
}

export const DHT_SORT_PRIORITY = [
  DHTOpType.RegisterAgentActivity,
  DHTOpType.StoreEntry,
  DHTOpType.StoreHeader,
  DHTOpType.RegisterUpdatedTo,
  DHTOpType.RegisterDeletedBy,
  DHTOpType.RegisterAddLink,
  DHTOpType.RegisterRemoveLink
];

export interface DHTOpContent<T, E> {
  header: Header;
  type: T;
  entry: E;
}

export type DHTOp =
  | DHTOpContent<DHTOpType.StoreHeader, void>
  | DHTOpContent<DHTOpType.StoreEntry, Entry>
  | DHTOpContent<DHTOpType.RegisterAgentActivity, void>
  | DHTOpContent<DHTOpType.RegisterUpdatedTo, { newEntry: Entry }>
  | DHTOpContent<
      DHTOpType.RegisterDeletedBy,
      EntryContent<EntryType.RemoveEntry, { deletedEntry: string }>
    >
  | DHTOpContent<
      DHTOpType.RegisterAddLink,
      EntryContent<
        EntryType.LinkAdd,
        { base: string; target: string; type: string; tag: string }
      >
    >
  | DHTOpContent<
      DHTOpType.RegisterRemoveLink,
      EntryContent<
        EntryType.LinkRemove,
        { base: string; target: string; type: string; timestamp: number }
      >
    >;

export function entryToDHTOps(entry: Entry, header: Header): DHTOp[] {
  let additionalDHTOps: DHTOp[] = [];
  
  switch (entry.type) {
    case EntryType.CreateEntry:
      if (header.replaced_entry_address) {
        additionalDHTOps = [
          {
            header,
            type: DHTOpType.RegisterUpdatedTo,
            entry: {
              newEntry: entry
            }
          }
        ];
      }
      break;
    case EntryType.RemoveEntry:
      additionalDHTOps = [
        {
          header,
          type: DHTOpType.RegisterDeletedBy,
          entry: entry
        }
      ];
      break;
    case EntryType.LinkAdd:
      additionalDHTOps = [
        {
          header,
          type: DHTOpType.RegisterAddLink,
          entry: entry
        }
      ];
      break;
    case EntryType.LinkRemove:
      additionalDHTOps = [
        {
          header,
          type: DHTOpType.RegisterRemoveLink,
          entry: entry
        }
      ];
      break;
  }

  return [
    ...additionalDHTOps,
    { header, type: DHTOpType.RegisterAgentActivity, entry: null },
    {
      header,
      type: DHTOpType.StoreEntry,
      entry
    },
    { header, type: DHTOpType.StoreHeader, entry: null }
  ];
}

export function neighborhood(dhtOp: DHTOp): string {
  switch (dhtOp.type) {
    case DHTOpType.StoreHeader:
      return hash(dhtOp.header);
    case DHTOpType.StoreEntry:
      return dhtOp.header.entry_address;
    case DHTOpType.RegisterUpdatedTo:
      return dhtOp.header.replaced_entry_address;
    case DHTOpType.RegisterAgentActivity:
      return dhtOp.header.agent_id;
    case DHTOpType.RegisterAddLink:
      return dhtOp.entry.payload.base;
    case DHTOpType.RegisterRemoveLink:
      return dhtOp.entry.payload.base;
    case DHTOpType.RegisterDeletedBy:
      return dhtOp.entry.payload.deletedEntry;
  }
}

export function hashDHTOp(dhtOp: DHTOp): string {
  switch (dhtOp.type) {
    case DHTOpType.RegisterUpdatedTo:
      return hash({
        entry: dhtOp.entry,
        replaces: dhtOp.header.replaced_entry_address
      });
    case DHTOpType.RegisterDeletedBy:
      return hash(dhtOp.entry);
  }

  const hashable = {
    type: dhtOp.type,
    header: dhtOp.header
  };

  return hash(hashable);
}

export function sortDHTOps(dhtOps: DHTOp[]): DHTOp[] {
  const prio = (dhtOp: DHTOp) =>
    DHT_SORT_PRIORITY.findIndex(type => type === dhtOp.type);
  return dhtOps.sort((dhtA: DHTOp, dhtB: DHTOp) => prio(dhtA) - prio(dhtB));
}
