import { LitElement, property, PropertyValues, html } from 'lit-element';
import { Cell, AGENT_HEADERS, HEADERS } from '../types/cell';
import { sharedStyles } from './sharedStyles';
import { Playground } from '../state/playground';
import { blackboardConnect } from '../blackboard/blackboard-connect';
import { selectActiveCells, selectActiveCell } from '../state/selectors';

export class DHTShard extends blackboardConnect<Playground>(
  'holochain-playground',
  LitElement
) {
  static style() {
    return sharedStyles;
  }

  buildDHTShardJson() {
    const cell = selectActiveCell(this.state);

    return cell.getDHTShard();
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    const dhtShard: any = this.shadowRoot.getElementById('dht-shard');
    if (dhtShard) dhtShard.data = this.buildDHTShardJson();
  }

  render() {
    return html`
      <div class="column">
        <span
          ><strong
            >Entries with associated metadata, and agent ids with all their
            headers</strong
          ></span
        >
        <json-viewer id="dht-shard" style="margin-top: 16px;"></json-viewer>
      </div>
    `;
  }
}

customElements.define('holochain-playground-dht-shard', DHTShard);
