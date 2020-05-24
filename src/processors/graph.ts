import { Cell } from "../types/cell";
import { location, compareBigInts } from "./hash";
import { Header } from "../types/header";
import { Entry, EntryType } from "../types/entry";
import { Dictionary } from "../types/common";

export function dnaNodes(cells: Cell[]) {
  const images = ["smartphone", "desktop", "laptop"]

  const sortedCells = cells.sort((a: Cell, b: Cell) =>
    compareBigInts(location(a.agentId), location(b.agentId))
  );
  
  const cellNodes = sortedCells.map((cell) => ({
    data: { id: cell.agentId, label: `${cell.agentId.substr(0, 6)}...` },
    classes: [images[Math.floor(Math.random() * 3)]],
  }));
  const edges = sortedCells.map((cell) =>
    cell.getNeighbors().map((neighbor) => ({
      data: {
        id: `${cell.agentId}->${neighbor}`,
        source: cell.agentId,
        target: neighbor,
      },
    }))
  );

  return [...cellNodes, ...[].concat(...edges)];
}

export function sourceChainNodes(cell: Cell) {
  if (!cell) return [];

  const nodes = [];

  const headersHashes = cell.sourceChain;
  let headerCount = 0;

  for (const headerHash of headersHashes) {
    const header: Header = cell.CAS[headerHash];
    const entry: Entry = cell.CAS[header.entry_address];

    const entryType =
      entry.type === EntryType.CreateEntry ? entry.payload.type : entry.type;

    nodes.push({
      data: { id: headerHash, data: header, label: `header${headerCount}` },
      classes: ["header"],
    });
    nodes.push({
      data: {
        id: header.entry_address,
        data: entry,
        label: `${entryType}`,
      },
      classes: [entry.type],
    });
    nodes.push({
      data: {
        id: `${headerHash}->${header.entry_address}`,
        source: headerHash,
        target: header.entry_address,
      },
    });

    if (header.last_header_address) {
      nodes.push({
        data: {
          id: `${headerHash}->${header.last_header_address}`,
          source: headerHash,
          target: header.last_header_address,
        },
      });
    }

    headerCount += 1;
  }

  return nodes;
}

export function allEntries(cells: Cell[], showAgentIds: boolean) {
  const entries: Dictionary<Entry> = {};
  const metadata: Dictionary<any> = {};

  for (const cell of cells) {
    for (const [key, entry] of Object.entries(cell.CASMeta)) {
      if (
        cell.CAS[key] &&
        (cell.CAS[key].type === EntryType.CreateEntry ||
          cell.CAS[key].type === EntryType.AgentId)
      ) {
        entries[key] = cell.CAS[key] as Entry;
        metadata[key] = cell.getEntryMetadata(key);
      }
    }
  }

  const compareHeader = (headerA: Header, headerB: Header) =>
    headerA.timestamp - headerB.timestamp;
  const compareEntries = (hashA: string, hashB: string) => {
    const headersA: Header[] = Object.values(
      metadata[hashA].HEADERS || metadata[hashA].AGENT_HEADERS
    ).sort(compareHeader) as Header[];
    const headersB: Header[] = Object.values(
      metadata[hashB].HEADERS || metadata[hashB].AGENT_HEADERS
    ).sort(compareHeader) as Header[];
    return headersA.length > 0
      ? headersA[0].timestamp
      : 0 - headersB.length > 0
      ? headersB[0].timestamp
      : 0;
  };
  const sortedEntries = Object.entries(
    entries
  ).sort(([keyA, entryA], [keyB, entryB]) => compareEntries(keyA, keyB));

  const linksEdges = [];
  const entryNodes = [];
  const entryTypeCount = {};

  for (const [key, entry] of sortedEntries) {
    const entryType =
      entry.type === EntryType.CreateEntry ? entry.payload.type : entry.type;
    if (!entryTypeCount[entryType]) entryTypeCount[entryType] = 0;

    entryNodes.push({
      data: {
        id: key,
        data: entry,
        label: `${entryType}${entryTypeCount[entryType]}`,
      },
      classes: [entry.type] as string[],
    });

    entryTypeCount[entryType] += 1;

    if (entry.type === EntryType.CreateEntry) {
      const implicitLinks = getImplicitLinks(
        Object.keys(entries),
        entry.payload
      );

      for (const implicitLink of implicitLinks) {
        linksEdges.push({
          data: {
            id: `${key}->${implicitLink.target}`,
            source: key,
            target: implicitLink.target,
            label: implicitLink.label,
          },
          classes: ["implicit"],
        });
      }
    }
  }

  for (const [key, entry] of Object.entries(metadata)) {
    if (entry.LINKS_TO) {
      for (const link of entry.LINKS_TO) {
        linksEdges.push({
          data: {
            id: `${key}->${link.target}`,
            source: key,
            target: link.target,
            label: `Type: ${link.type}${link.tag ? `, Tag: ${link.tag}` : ""}`,
          },
          classes: ["explicit"],
        });
      }
    }

    if (entry.REPLACED_BY && entry.REPLACED_BY.length > 0) {
      entryNodes.find((node) => node.data.id === key).classes.push("updated");
      for (const replacedBy of entry.REPLACED_BY) {
        linksEdges.push({
          data: {
            id: `${key}-replaced-by-${replacedBy}`,
            source: key,
            target: replacedBy,
            label: "replaced by",
          },
          classes: ["update-link"],
        });
      }
    }

    if (entry.DELETED_BY) {
      entryNodes.find((node) => node.data.id === key).classes.push("deleted");
    }
  }

  if (!showAgentIds) {
    for (const [key, entry] of Object.entries(entries)) {
      if (entry.type === EntryType.AgentId) {
        const links = linksEdges.filter(
          (edge) => edge.data.source === key || edge.data.target === key
        );
        if (links.length === 0) {
          const index = entryNodes.findIndex((node) => node.data.id === key);
          entryNodes.splice(index, 1);
        }
      }
    }
  }

  return [...entryNodes, ...linksEdges];
}

export function getImplicitLinks(
  allEntryIds: string[],
  value: any
): Array<{ label: string; target: string }> {
  if (!value) return [];
  if (typeof value === "string") {
    return allEntryIds.includes(value)
      ? [{ label: undefined, target: value }]
      : [];
  }
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "string"
  ) {
    return value
      .filter((v) => allEntryIds.includes(v))
      .map((v) => ({ target: v, label: undefined }));
  }
  if (typeof value === "object") {
    const values = Object.entries(value).map(([key, v]) => {
      const implicitLinks = getImplicitLinks(allEntryIds, v);
      for (const implicitLink of implicitLinks) {
        if (!implicitLink.label) {
          implicitLink.label = key;
        }
      }
      return implicitLinks;
    });
    return [].concat(...values);
  }
  return [];
}
