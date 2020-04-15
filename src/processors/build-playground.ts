import { Playground } from "../state/playground";
import { createConductors } from "./create-conductors";

export function buildPlayground(
  dna: string,
  numConductors: number
): Playground {
  const redundancyFactor = 3;

  const conductors = createConductors(numConductors, [], redundancyFactor, dna);

  return {
    activeDNA: dna,
    activeAgentId: undefined,
    connected: false,
    activeEntryId: undefined,
    conductors,
    redundancyFactor,
  };
}
