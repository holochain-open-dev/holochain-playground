import { Dictionary } from './common';
import { Cell, CellContents } from './cell';
import { hash } from '../processors/hash';
import { SendMessage, NetworkMessage } from './network';

export interface ConductorContents {
  agentIds: string[];
  cells: Dictionary<CellContents>;
  redundancyFactor: number;
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

  readyPromise: Promise<string[]>;

  constructor(
    protected redundancyFactor: number,
    protected options?: ConductorOptions
  ) {
    if (options && (options as { agentIds: string[] }).agentIds) {
      this.agentIds = (options as { agentIds: string[] }).agentIds;
    } else {
      let seed;
      if (options && (options as any).seed) {
        seed = (options as any).seed;
      } else {
        seed = Math.random().toString().substring(2);
      }
      this.readyPromise = hash(`${seed}${0}`).then(
        (h) => (this.agentIds = [h])
      );
    }
  }

  static from(contents: ConductorContents) {
    const conductor = new Conductor(contents.redundancyFactor, {
      agentIds: contents.agentIds,
    });
    for (const [key, cell] of Object.entries(contents.cells)) {
      conductor.cells[key] = Cell.from(conductor, cell);
    }

    return conductor;
  }

  ready(): Promise<void> {
    if (this.agentIds) return new Promise((r) => r());
    else return new Promise((r) => this.readyPromise.then(() => r()));
  }

  toContents(): ConductorContents {
    const cellContents = {};
    for (const [key, cell] of Object.entries(this.cells)) {
      cellContents[key] = cell.toContents();
    }
    return {
      agentIds: this.agentIds,
      redundancyFactor: this.redundancyFactor,
      cells: cellContents,
    };
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
