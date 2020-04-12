import { Conductor } from "../types/conductor";
import { SendMessage, NetworkMessage } from "../types/network";
import { Playground } from "../state/playground";
import { hookUpConductors } from "./message";

export function buildPlayground(
  dna: string,
  numConductors: number
): Playground {
  const conductors: Conductor[] = [];

  const redundancyFactor = 3;

  for (let i = 0; i < numConductors; i++) {
    const conductor = new Conductor(redundancyFactor);
    conductors.push(conductor);
  }

  hookUpConductors(conductors);

  const peers = conductors.map((c) => c.agentIds[0]);

  for (const conductor of conductors) {
    conductor.installDna(
      dna,
      peers.filter((p) => p !== conductor.agentIds[0])
    );
  }

  for (const conductor of conductors) {
    conductor.initDna(dna);
  }

  return {
    activeDNA: dna,
    activeAgentId: undefined,
    connected: false,
    activeEntryId: undefined,
    conductors,
    redundancyFactor,
  };
}
