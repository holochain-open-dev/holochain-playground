import { Dictionary } from "./common";
import { Cell, CellContents } from "./cell";
import { hash } from "../processors/hash";
import { SendMessage, NetworkMessage } from "./network";

export interface ConductorContents {
  agentIds: string[];
  cells: Dictionary<CellContents>;
  redundancyFactor: number;
  seed: string;
}

export type ConductorOptions =
  | {
      seed: string;
    }
  | { agentIds: string[] };

export class Conductor {
  agentIds: string[];
  readonly cells: Dictionary<Cell> = {};
  sendMessage: SendMessage;

  constructor(
    protected redundancyFactor: number,
    protected options?: ConductorOptions
  ) {
    if ((options as { agentIds: string[] }).agentIds) {
      this.agentIds = (options as { agentIds: string[] }).agentIds;
    } else {
      let seed = (options as any).seed;
      if (!seed) {
        seed = Math.random().toString().substring(2);
      }
      this.agentIds = [hash(`${seed}${0}`)];
    }
  }

  static from(contents: ConductorContents) {
    const conductor = new Conductor(contents.redundancyFactor, {
      seed: contents.seed,
    });
    conductor.agentIds = contents.agentIds;
    for (const [key, cell] of Object.entries(contents.cells)) {
      conductor.cells[key] = Cell.from(conductor, cell);
    }

    return conductor;
  }

  installDna(dna: string, peers: string[]): Cell {
    const agentId = this.agentIds[0];
    const cell = new Cell(this, dna, agentId, this.redundancyFactor, peers);
    this.cells[dna] = cell;

    return cell;
  }

  initDna(dna: string) {
    this.cells[dna].init();
  }

  inboundNetworkMessage(
    dna: string,
    fromAgentId: string,
    message: NetworkMessage
  ): any {
    return this.cells[dna].handleNetworkMessage(fromAgentId, message);
  }
}
