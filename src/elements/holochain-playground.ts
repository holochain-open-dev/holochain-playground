import { LitElement, html, css, property, query } from "lit-element";

import "@material/mwc-icon-button";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-switch";
import "@material/mwc-formfield";
import "@material/mwc-top-app-bar-fixed";
import "@material/mwc-menu";
import "@material/mwc-list/mwc-list-item";

import { sharedStyles } from "./sharedStyles";
import { buildPlayground } from "../processors/build-playground";
import { hash } from "../processors/hash";
import { Blackboard } from "../blackboard/blackboard";
import { downloadFile, fileToPlayground } from "../processors/files";
import {
  selectCellCount,
  selectGlobalDHTOps,
  selectUniqueDHTOps,
} from "../state/selectors";
import { Playground } from "../state/playground";
import { connectToConductors } from "../processors/connect-to-conductors";
import { Header } from '../types/header';

export class HolochainPlayground extends LitElement {
  @query("#file-upload")
  fileUpload: HTMLInputElement;

  @query("#stats")
  stats: any;

  @property({ type: Object })
  playground: Playground;

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
        mwc-button,
        mwc-formfield,
        mwc-switch {
          --mdc-theme-primary: white;
        }
      `,
    ];
  }

  firstUpdated() {
    if (!this.conductorUrls) {
      this.playground = buildPlayground(hash("dna1"), 10);
    }
    this.blackboard = new Blackboard(this.playground);
    this.blackboard.subscribe(() => this.requestUpdate());

    if (this.conductorUrls) {
      connectToConductors(this.blackboard, this.conductorUrls);
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
      type: "application/json",
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
              .filter(([key, header]) => (header as Header).entry_address === entryId)
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
          "activeAgentId",
          conductor.cells[this.blackboard.state.activeDNA].agentId
        );
      }
    }
  }

  render() {
    if (!this.blackboard || !this.blackboard.state) return html`<span>Loading...</span>`;

    return html`
      <blackboard-container .blackboard=${this.blackboard} class="fill column">
        <mwc-top-app-bar-fixed>
          <span slot="title">DNA: ${this.blackboard.state.activeDNA}</span>

          <div
            class="row center-content"
            slot="actionItems"
            style="margin-right: 36px;"
          >
            <span style="font-size: 0.875rem; margin-right: 10px;"
              >DESIGNER MODE</span
            >

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

          <div slot="actionItems" style="position: relative;">
            <mwc-menu
              id="stats"
              style="pointer-events: none; position: absolute; top: 40px;"
            >
              <mwc-list-item
                >Nodes: ${selectCellCount(this.blackboard.state)}</mwc-list-item
              >
              <mwc-list-item
                >Redundancy factor:
                ${this.blackboard.state.redundancyFactor}</mwc-list-item
              >
              <mwc-list-item
                >Global DHT Ops:
                ${selectGlobalDHTOps(this.blackboard.state)}</mwc-list-item
              >
              <mwc-list-item
                >Unique DHT Ops:
                ${selectUniqueDHTOps(this.blackboard.state)}</mwc-list-item
              >
            </mwc-menu>

            <mwc-button
              label="DHT Stats"
              icon="equalizer"
              style="margin-right: 18px;"
              @click=${() => (this.stats.open = true)}
            ></mwc-button>
          </div>
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
    `;
  }
}
