import { pinToBoard } from '../blackboard/blackboard-mixin';
import { Playground } from '../state/playground';
import { LitElement, html, css } from 'lit-element';
import { sharedStyles } from './sharedStyles';

export class DesignerMode extends pinToBoard<Playground>(LitElement) {
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
        <entry-graph
          class="fill padding"
          style="flex: 20; padding-right: 0;"
        ></entry-graph>
        <div class="column" style="flex: 16;">
          <mwc-card style="width: auto;" class="padding center-content">
            <dht-stats></dht-stats>
          </mwc-card>
          ${this.state.conductorsUrls === undefined
            ? html`
                <mwc-card
                  style="width: auto; padding-top: 0;"
                  class="padding fill"
                >
                  <create-entries class="padding fill"></create-entries>
                </mwc-card>
              `
            : html``}
          <mwc-card style="width: auto; padding-top: 0;" class="padding fill">
            <entry-detail class="padding fill" withMetadata></entry-detail>
          </mwc-card>
        </div>
      </div>
    `;
  }
}
