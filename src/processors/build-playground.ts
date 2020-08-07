import { Playground } from '../state/playground';
import { createConductors } from './create-conductors';

export async function buildPlayground(
  dna: string,
  numConductors: number
): Promise<Playground> {
  const redundancyFactor = 3;

  const conductors = await createConductors(numConductors, [], redundancyFactor, dna);

  return {
    activeDNA: dna,
    activeAgentId: undefined,
    conductorsUrls: undefined,
    activeEntryId: undefined,
    conductors,
    redundancyFactor,
  };
}
