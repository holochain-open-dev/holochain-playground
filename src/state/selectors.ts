import { Playground } from "./playground";
import { DHTOp, DHTOpType } from "../types/dht-op";

export const selectCellCount = (state: Playground) =>
  selectActiveCells(state).length;

export const selectActiveCells = (state: Playground) =>
  state.conductors.map((c) => c.cells[state.activeDNA]).filter((c) => !!c);

export const selectGlobalDHTOps = (state: Playground) => {
  let dhtOps = 0;

  for (const cell of selectActiveCells(state)) {
    dhtOps += Object.keys(cell.DHTOpTransforms).length;
  }

  return dhtOps;
};

export const selectHoldingCells = (state: Playground) => (entryId: string) =>
  selectActiveCells(state).filter(
    (c) =>
      !!Object.values(c.DHTOpTransforms).find(
        (dhtOp: DHTOp) =>
          dhtOp.type === DHTOpType.StoreEntry &&
          dhtOp.header.entry_address === entryId
      )
  );

export const selectActiveConductor = (state: Playground) =>
  state.activeAgentId
    ? state.conductors.find((conductor) =>
        conductor.agentIds.find((agentId) => agentId === state.activeAgentId)
      )
    : undefined;

export const selectActiveCell = (state: Playground) =>
  selectActiveConductor(state)
    ? Object.values(selectActiveConductor(state).cells).find(
        (cell) => cell.agentId === state.activeAgentId
      )
    : undefined;

export const selectUniqueDHTOps = (state: Playground) => {
  const globalDHTOps = {};

  for (const cell of selectActiveCells(state)) {
    for (const hash of Object.keys(cell.DHTOpTransforms)) {
      globalDHTOps[hash] = {};
    }
  }

  return Object.keys(globalDHTOps).length;
};

export const selectEntryMetadata = (state: Playground) => (entryId: string) => {
  if (!state.activeDNA) return undefined;
  for (const conductor of state.conductors) {
    const entry = conductor.cells[state.activeDNA].getEntryMetadata(entryId);
    if (entry) {
      return entry;
    }
  }
  return undefined;
};

export const selectActiveEntry = (state: Playground) => {
  if (!state.activeEntryId) return undefined;
  return selectEntry(state)(state.activeEntryId);
};

export const selectEntry = (state: Playground) => (entryId: string) => {
  if (!state.activeDNA) return undefined;
  for (const conductor of state.conductors) {
    const entry = conductor.cells[state.activeDNA].CAS[entryId];
    if (entry) {
      return entry;
    }
  }
  return undefined;
};
