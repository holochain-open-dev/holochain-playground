import { LitElement, html, css } from 'lit-element';

import '../../dist/elements/holochain-playground-entry-graph';
import '../../dist/elements/holochain-playground-dht-stats';
import '../../dist/elements/holochain-playground-create-entries';
import '../../dist/elements/holochain-playground-entry-detail';
import { sharedStyles } from '../../dist/elements/sharedStyles';
import { blackboardConnect } from '../../dist/blackboard/blackboard-connect';

import '@authentic/mwc-card';

export class DesignerMode extends blackboardConnect(
  'holochain-playground',
  LitElement
) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
        }

        .padding {
          padding: 16px;
        }
      `,
    ];
  }

  render() {
    return html`
      <div class="row fill">
        <holochain-playground-entry-graph
          class="fill padding"
          style="flex: 20; padding-right: 0;"
        ></holochain-playground-entry-graph>

        <div class="column" style="flex: 16;">
          <mwc-card style="width: auto;" class="padding center-content">
            <holochain-playground-dht-stats></holochain-playground-dht-stats>
          </mwc-card>

          ${this.state.conductorsUrls === undefined
            ? html`
                <mwc-card
                  style="width: auto; padding-top: 0;"
                  class="padding fill"
                >
                  <holochain-playground-create-entries
                    class="padding fill"
                  ></holochain-playground-create-entries>
                </mwc-card>
              `
            : html``}

          <mwc-card style="width: auto; padding-top: 0;" class="padding fill">
            <holochain-playground-entry-detail
              class="padding fill"
              withMetadata
            ></holochain-playground-entry-detail>
          </mwc-card>
        </div>
      </div>
    `;
  }
}

customElements.define('designer-mode', DesignerMode);
