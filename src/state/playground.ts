import { Conductor } from '../types/conductor';

export interface Playground {
  activeDNA: string;
  activeAgentId: string | undefined;
  activeEntryId: string | undefined;
  conductors: Conductor[];
  redundancyFactor: number;
  conductorsUrls: string[] | undefined;
}
