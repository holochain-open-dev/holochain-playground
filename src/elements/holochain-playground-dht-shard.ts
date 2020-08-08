import { LitElement, property, PropertyValues, html, query } from 'lit-element';
import { sharedStyles } from './sharedStyles';
import { Playground } from '../state/playground';
import { blackboardConnect } from '../blackboard/blackboard-connect';
import { selectActiveCell, selectCell } from '../state/selectors';
import { Cell } from '../types/cell';

export class DHTShard extends blackboardConnect<Playground>(
  'holochain-playground',
  LitElement
) {
  @query('#dht-shard')
  private shardViewer: any;

  @property({ type: Object })
  cell: { dna: string; agentId: string } = undefined;

  private selectedCell: Cell = undefined;

  static style() {
    return sharedStyles;
  }

  getCell() {
    if (this.cell) {
      return selectCell(this.blackboard.state)(
        this.cell.dna,
        this.cell.agentId
      );
    } else return selectActiveCell(this.blackboard.state);
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    this.selectedCell = this.getCell();
    if (this.selectedCell) {
      this.shardViewer.data = this.selectedCell.getDHTShard();
    }
  }

  render() {
    return html`
      <div class="column">
        <span>
          ${this.selectedCell
            ? html`
                <strong>
                  Entries with associated metadata, and agent ids with all their
                  headers
                </strong>
              `
            : html`
                <span class="placeholder">
                  Select a cell to see its DHT Shard
                </span>
              `}
        </span>

        <json-viewer id="dht-shard" style="margin-top: 16px;"></json-viewer>
      </div>
    `;
  }
}

customElements.define('holochain-playground-dht-shard', DHTShard);
