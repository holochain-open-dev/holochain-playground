import { LitElement, html, css } from "lit-element";
import { selectActiveConductor } from "../state/selectors";
import { Playground } from "../state/playground";
import { sharedStyles } from "./sharedStyles";
import { pinToBoard } from "../blackboard/blackboard-mixin";

export class TechnicalMode extends pinToBoard<Playground>(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
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
            ? html` <conductor-detail class="fill"></conductor-detail> `
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
