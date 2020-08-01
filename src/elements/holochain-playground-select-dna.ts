import { blackboardConnect } from '../blackboard/blackboard-connect';
import { Playground } from '../state/playground';
import { LitElement, html } from 'lit-element';
import { selectAllDNAs } from '../state/selectors';

export class SelectDNA extends blackboardConnect<Playground>(
  'holochain-playground',
  LitElement
) {
  selectDNA(dna: string) {
    this.blackboard.update('activeAgentId', null);
    this.blackboard.update('activeEntryId', null);
    this.blackboard.update('activeDNA', dna);
  }

  render() {
    const dnas = selectAllDNAs(this.blackboard.state);
    if (dnas.length === 1) return html`<span>DNA: ${dnas[0]}</span>`;
    else {
      return html`
        <span style="margin-right: 16px;">DNA</span>
        <mwc-select
          outlined
          style="width: 28em; position: absolute; top: 4px;"
          fullwidth
          @selected=${(e) => this.selectDNA(dnas[e.detail.index])}
        >
          ${dnas.map(
            (dna) =>
              html`
                <mwc-list-item
                  ?selected=${this.blackboard.state.activeDNA === dna}
                  .value=${dna}
                  >${dna}</mwc-list-item
                >
              `
          )}
        </mwc-select>
      `;
    }
  }
}

customElements.define('holochain-playground-select-dna', SelectDNA);
