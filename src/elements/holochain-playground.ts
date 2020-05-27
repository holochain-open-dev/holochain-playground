import {
  LitElement,
  html,
  css,
  property,
  query,
  PropertyValues,
} from 'lit-element';

import '@material/mwc-icon-button';
import '@material/mwc-button';
import '@material/mwc-switch';
import '@material/mwc-select';
import '@material/mwc-formfield';
import '@material/mwc-top-app-bar-fixed';
import '@material/mwc-menu';
import '@material/mwc-list/mwc-list-item';
import '@authentic/mwc-circular-progress';
import { Snackbar } from '@material/mwc-snackbar';

import { sharedStyles } from './sharedStyles';
import { buildPlayground } from '../processors/build-playground';
import { hash } from '../processors/hash';
import { Blackboard } from '../blackboard/blackboard';
import { downloadFile, fileToPlayground } from '../processors/files';
import { Playground } from '../state/playground';
import { connectToConductors } from '../processors/connect-to-conductors';
import { Header } from '../types/header';
import {
  serializePlayground,
  deserializePlayground,
} from '../processors/serialize';
import { selectAllDNAs } from '../state/selectors';

export class HolochainPlayground extends LitElement {
  @query('#file-upload')
  fileUpload: HTMLInputElement;

  @query('#snackbar')
  snackbar: Snackbar;

  @property({ type: Object })
  playground: Playground;

  @property({ type: String })
  message: string | undefined;

  @property({ type: Array })
  conductorUrls: string[] | undefined = undefined;

  @property({ type: Boolean })
  technicalMode: boolean = false;

  @property({ type: Object })
  blackboard: Blackboard<Playground>;

  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-top-app-bar-fixed mwc-button,
        mwc-top-app-bar-fixed mwc-formfield,
        mwc-top-app-bar-fixed mwc-switch {
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

  initialPlayground() {
    return buildPlayground(hash('dna1'), 10);
  }

  firstUpdated() {
    if (!this.conductorUrls) {
      this.playground = this.initialPlayground();
    }
    this.blackboard = new Blackboard(this.playground, {
      persistId: 'playground',
      serializer: serializePlayground,
      deserializer: deserializePlayground,
    });

    this.blackboard.subscribe(() => this.requestUpdate());
    this.blackboard.select('conductorsUrls').subscribe(async (urls) => {
      if (urls !== undefined) {
        try {
          await connectToConductors(this.blackboard, urls);
        } catch (e) {
          console.error(e);
          this.showError('Error when connecting with the nodes');
        }
      }
    });
  }

  showError(error: string) {
    this.message = error;
    this.snackbar.show();
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    if (changedValues.has('conductorUrls')) {
      this.blackboard.update('conductorsUrls', this.conductorUrls);
    }
  }

  import() {
    const file = this.fileUpload.files[0];

    var reader = new FileReader();
    reader.onload = (event) => {
      const playground = JSON.parse(event.target.result as string);
      this.blackboard.updateState(fileToPlayground(playground));
    };
    reader.readAsText(file);
  }

  export() {
    const playground = this.blackboard.state;
    for (const conductor of playground.conductors) {
      for (const cell of Object.values(conductor.cells)) {
        cell.conductor = undefined;
      }
    }
    const blob = new Blob([JSON.stringify(playground)], {
      type: 'application/json',
    });

    downloadFile(
      `holochain-playground-${Date.now().toLocaleString()}.json`,
      blob
    );
  }

  toggleMode() {
    this.technicalMode = !this.technicalMode;
    if (this.technicalMode) {
      if (this.blackboard.state.activeEntryId) {
        const entryId = this.blackboard.state.activeEntryId;
        const activeDNA = this.blackboard.state.activeDNA;
        const conductor = this.blackboard.state.conductors.find((c) => {
          const cell = c.cells[activeDNA];

          const entryHeaders =
            cell.CAS[entryId] &&
            Object.entries(cell.CAS)
              .filter(
                ([key, header]) => (header as Header).entry_address === entryId
              )
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
          conductor.cells[this.blackboard.state.activeDNA].agentId
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

  renderSnackbar() {
    return html`
      <mwc-snackbar id="snackbar" labelText=${this.message}>
        <mwc-icon-button icon="close" slot="dismiss"></mwc-icon-button>
      </mwc-snackbar>
    `;
  }

  selectDNA(dna: string) {
    this.blackboard.update('activeAgentId', null);
    this.blackboard.update('activeEntryId', null);
    this.blackboard.update('activeDNA', dna);
  }

  renderDNA() {
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

  render() {
    return html`
      ${this.renderSnackbar()}
      ${!this.blackboard || !this.blackboard.state
        ? html`<div class="row fill center-content">
            <mwc-circular-progress></mwc-circular-progress>
          </div>`
        : html`
            <blackboard-container
              .blackboard=${this.blackboard}
              class="fill column"
            >
              <connect-to-nodes id="connect-to-nodes"></connect-to-nodes>
              <mwc-top-app-bar-fixed>
                <div slot="title">${this.renderDNA()}</div>

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

                <mwc-button
                  slot="actionItems"
                  style="margin-right: 18px;"
                  label=${this.blackboard.state.conductorsUrls
                    ? 'CONNECTED NODES'
                    : 'CONNECT TO NODES'}
                  icon=${this.blackboard.state.conductorsUrls
                    ? 'sync'
                    : 'sync_disabled'}
                  @click=${() => {
                    (this.shadowRoot.getElementById(
                      'connect-to-nodes'
                    ) as any).open = true;
                  }}
                ></mwc-button>

                <mwc-button
                  slot="actionItems"
                  label="Reset"
                  style="margin-right: 18px;"
                  icon="settings_backup_restore"
                  @click=${() => this.resetState()}
                ></mwc-button>

                <mwc-button
                  slot="actionItems"
                  label="Import"
                  icon="publish"
                  style="margin-right: 18px;"
                  @click=${() => this.fileUpload.click()}
                ></mwc-button>
                <mwc-button
                  slot="actionItems"
                  label="Export"
                  icon="get_app"
                  style="margin-right: 18px;"
                  @click=${() => this.export()}
                ></mwc-button>
              </mwc-top-app-bar-fixed>
              <div class="row fill">
                ${this.technicalMode
                  ? html` <technical-mode class="fill"></technical-mode> `
                  : html` <designer-mode class="fill"></designer-mode> `}
              </div>
            </blackboard-container>
            <input
              type="file"
              id="file-upload"
              accept="application/json"
              style="display:none"
              @change=${() => this.import()}
            />
          `}
    `;
  }
}
