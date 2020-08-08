import { LitElement, property, html, css, query } from 'lit-element';
import '@authentic/mwc-card';
import '@material/mwc-select';
import '@material/mwc-list';
import '@material/mwc-list/mwc-list-item';
import '@alenaksu/json-viewer';
import '@material/mwc-tab-bar';
import '@material/mwc-tab';
import { Dialog } from '@material/mwc-dialog';

import { sharedStyles } from './sharedStyles';
import { Playground } from '../state/playground';
import { blackboardConnect } from '../blackboard/blackboard-connect';

import './holochain-playground-source-chain';
import './holochain-playground-create-entries';
import './holochain-playground-dht-shard';
import './holochain-playground-entry-detail';

export class ConductorDetail extends blackboardConnect<Playground>(
  'holochain-playground',
  LitElement
) {
  @property({ type: Number })
  selectedTabIndex: number = 0;

  @query('#conductor-help')
  private conductorHelp: Dialog;

  firstUpdated() {
    this.addEventListener('entry-committed', (e: CustomEvent) => {
      this.selectedTabIndex = 0;
    });
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
        }

        mwc-card {
          padding: 16px;
        }
      `,
    ];
  }

  renderAgentHelp() {
    return html`
      <mwc-dialog
        id="conductor-help"
        heading="Node Help"
        style="--mdc-dialog-max-width: 700px"
      >
        <span>
          You've selected the node or conductor with Agent ID
          ${this.blackboard.state.activeAgentId}. Here you can see its internal state:
          <ul>
            <li>
              <strong>Source Chain</strong>: entries that this node has
              committed. Here you can see in grey the
              <a
                href="https://developer.holochain.org/docs/concepts/3_private_data/"
                target="_blank"
                >headers
              </a>
              of the entries, and in colors the entries themselves. When you
              select an entry, the other nodes that are holding the entry DHT
              will be hightlighted in the DHT.
            </li>
            <br />
            <li>
              <strong>DHT Shard</strong>: slice of the DHT that this node is
              holding. You can see the list of all the entries that this node is
              holding indexed by their hash, and metadata associated to those
              entries.
            </li>
            <br />
            <li>
              <strong>Commit Entries</strong>: here you can actually create
              entries yourself. They will be created on behalf of this node. Try
              it! You can create an entry and see where it lands on the DHT, and
              go to the DHT Shard of those nodes and check it's there.
            </li>
          </ul>
        </span>
        <mwc-button slot="primaryAction" dialogAction="cancel">
          Got it!
        </mwc-button>
      </mwc-dialog>
    `;
  }

  render() {
    return html`
      ${this.renderAgentHelp()}
      <mwc-card style="width: auto;" class="fill">
        <div class="column fill">
          <div class="row" style="padding: 16px">
            <div class="column" style="flex: 1;">
              <h3 class="title">Conductor Detail</h3>
              <span>Agent Id: ${this.blackboard.state.activeAgentId}</span>
            </div>
            <mwc-icon-button
              icon="help_outline"
              @click=${() => (this.conductorHelp.open = true)}
            ></mwc-icon-button>
          </div>
          <div class="column fill">
            <mwc-tab-bar
              @MDCTabBar:activated=${(e) =>
                (this.selectedTabIndex = e.detail.index)}
              .activeIndex=${this.selectedTabIndex}
            >
              <mwc-tab label="Source Chain"></mwc-tab>
              <mwc-tab label="DHT Shard"></mwc-tab>
              <mwc-tab label="Commit entries"></mwc-tab>
            </mwc-tab-bar>
            <div style="padding: 16px;" class="column fill">
              ${this.selectedTabIndex === 0
                ? html`
                    <div class="row fill">
                      <holochain-playground-source-chain
                        class="fill"
                      ></holochain-playground-source-chain>
                      <div class="flex-scrollable-parent">
                        <div class="flex-scrollable-container">
                          <div class="flex-scrollable-y">
                            <holochain-playground-entry-detail
                              class="fill"
                            ></holochain-playground-entry-detail>
                          </div>
                        </div>
                      </div>
                    </div>
                  `
                : this.selectedTabIndex === 1
                ? html`
                    <div class="flex-scrollable-parent">
                      <div class="flex-scrollable-container">
                        <div class="flex-scrollable-y">
                          <holochain-playground-dht-shard></holochain-playground-dht-shard>
                        </div>
                      </div>
                    </div>
                  `
                : html`
                    <holochain-playground-create-entries></holochain-playground-create-entries>
                  `}
            </div>
          </div>
        </div>
      </mwc-card>
    `;
  }
}

customElements.define('holochain-playground-conductor-detail', ConductorDetail);
