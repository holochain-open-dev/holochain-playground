import { LitElement, html, css } from 'lit-element';

import '@material/mwc-icon-button';
import '@material/mwc-button';
import '@material/mwc-switch';
import '@material/mwc-select';
import '@material/mwc-formfield';
import '@material/mwc-top-app-bar-fixed';
import '@material/mwc-menu';
import '@material/mwc-list/mwc-list-item';
import '@authentic/mwc-circular-progress';

import { blackboardConnect } from '../../dist/blackboard/blackboard-connect';
import { connectToConductors } from '../../dist/processors/connect-to-conductors';
import '../../dist/elements/holochain-playground-container';
import '../../dist/elements/holochain-playground-select-dna';
import '../../dist/elements/holochain-playground-connect-to-nodes';
import '../../dist/elements/holochain-playground-import-export';
import '../../dist/blackboard/blackboard-connect';
import { sharedStyles } from '../../dist/elements/sharedStyles';

import './designer-mode';
import './technical-mode';

export class PlaygroundApp extends blackboardConnect(
  'holochain-playground',
  LitElement
) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: contents;
        }

        mwc-top-app-bar-fixed mwc-button,
        mwc-top-app-bar-fixed mwc-formfield,
        mwc-top-app-bar-fixed mwc-switch,
        holochain-playground-connect-to-nodes,
        holochain-playground-import-export {
          --mdc-theme-primary: white;
        }

        mwc-select {
          --mdc-theme-primary: black;
          --mdc-select-focused-label-color: white;
          --mdc-select-focused-dropdown-icon-color: white;
          --mdc-select-ink-color: white;
          --mdc-select-label-ink-color: white;
          --mdc-select-outlined-idle-border-color: white;
          --mdc-select-dropdown-icon-color: white;
          --mdc-select-outlined-hover-border-color: white;
        }
      `,
    ];
  }

  static get properties() {
    return {
      technicalMode: {
        type: Boolean,
      },
    };
  }

  toggleMode() {
    this.technicalMode = !this.technicalMode;
    if (this.technicalMode) {
      if (this.state.activeEntryId) {
        const entryId = this.state.activeEntryId;
        const activeDNA = this.state.activeDNA;
        const conductor = this.state.conductors.find((c) => {
          const cell = c.cells[activeDNA];

          const entryHeaders =
            cell.CAS[entryId] &&
            Object.entries(cell.CAS)
              .filter(([key, header]) => header.entry_address === entryId)
              .map(([key, _]) => key);

          const headerIds = cell.sourceChain;

          return (
            entryHeaders &&
            headerIds.find((sourceChainHeaderId) =>
              entryHeaders.includes(sourceChainHeaderId)
            )
          );
        });

        this.blackboard.update(
          'activeAgentId',
          conductor.cells[this.state.activeDNA].agentId
        );
      }
    }
  }

  resetState() {
    this.blackboard.reset();
    if (this.conductorUrls) {
      connectToConductors(this.blackboard, this.conductorUrls);
    } else {
      this.blackboard.updateState(this.initialPlayground());
    }
  }

  render() {
    return html`
      ${!this.blackboard || !this.state
        ? html`<div class="row fill center-content">
            <mwc-circular-progress></mwc-circular-progress>
          </div>`
        : html`
            <div class="column fill">
              <mwc-top-app-bar-fixed>
                <holochain-playground-select-dna slot="title">
                </holochain-playground-select-dna>

                <div
                  class="row center-content"
                  slot="actionItems"
                  style="margin-right: 36px;"
                >
                  <span style="font-size: 0.875rem; margin-right: 10px;">
                    DESIGNER MODE
                  </span>

                  <mwc-formfield
                    label="TECHNICAL MODE"
                    style="--mdc-theme-text-primary-on-background: white;"
                  >
                    <mwc-switch
                      .checked=${this.technicalMode}
                      @change=${() => this.toggleMode()}
                    ></mwc-switch>
                  </mwc-formfield>
                </div>

                <holochain-playground-connect-to-nodes
                  id="connect-to-nodes"
                  slot="actionItems"
                ></holochain-playground-connect-to-nodes>

                <mwc-button
                  slot="actionItems"
                  label="Reset"
                  style="margin-right: 18px;"
                  icon="settings_backup_restore"
                  @click=${() => this.resetState()}
                ></mwc-button>

                <holochain-playground-import-export
                  slot="actionItems"
                ></holochain-playground-import-export>
              </mwc-top-app-bar-fixed>
              <div class="row fill">
                ${this.technicalMode
                  ? html` <technical-mode class="fill"></technical-mode> `
                  : html` <designer-mode class="fill"></designer-mode> `}
              </div>
            </div>
          `}
    `;
  }
}

customElements.define('playground-app', PlaygroundApp);
