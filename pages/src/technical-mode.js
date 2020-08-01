import { LitElement, html, css } from 'lit-element';
import { selectActiveConductor } from '../../dist/state/selectors';
import { blackboardConnect } from '../../dist/blackboard/blackboard-connect';

export class TechnicalMode extends blackboardConnect(
  'holochain-playground',
  LitElement
) {
  static get styles() {
    return [
      css`
        :host {
          display: flex;
        }
        .row {
          display: flex;
          flex-direction: row;
        }
        .column {
          display: flex;
          flex-direction: column;
        }
        .center-content {
          align-items: center;
          justify-content: center;
        }
      `,
    ];
  }

  render() {
    return html`
      <div class="row fill">
        <div style="flex: 1;" class="column">
          <mwc-card style="width: auto; margin: 16px; margin-bottom: 0;">
            <dht-stats></dht-stats>
          </mwc-card>

          ${selectActiveConductor(this.state)
            ? html`
                <holochain-playground-conductor-detail
                  class="fill"
                ></holochain-playground-conductor-detail>
              `
            : html`
                <div class="row fill center-content">
                  <span class="placeholder">Select node to see its state</span>
                </div>
              `}
        </div>
        <div class="column" style="flex: 1;">
          <dht-graph style="flex: 1;"></dht-graph>
        </div>
      </div>
    `;
  }
}

customElements.define('technical-mode', TechnicalMode);
