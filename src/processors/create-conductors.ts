import { Conductor } from "../types/conductor";
import { hookUpConductors } from "./message";

export function createConductors(
  conductorsToCreate: number,
  currentConductors: Conductor[],
  redundancyFactor: number,
  dna: string
): Conductor[] {
  const newConductors: Conductor[] = [];
  for (let i = 0; i < conductorsToCreate; i++) {
    const conductor = new Conductor(redundancyFactor);
    newConductors.push(conductor);
  }

  const allConductors = [...currentConductors, ...newConductors];

  hookUpConductors(allConductors);

  const peers = allConductors.map((c) => c.agentIds[0]);

  for (const conductor of newConductors) {
    conductor.installDna(
      dna,
      peers.filter((p) => p !== conductor.agentIds[0])
    );
  }

  for (const conductor of newConductors) {
    conductor.initDna(dna);
  }
  return allConductors;
}
