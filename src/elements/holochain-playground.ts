import {
  LitElement,
  html,
  css,
  property,
  query,
  PropertyValues,
} from "lit-element";

import "@material/mwc-icon-button";
import "@material/mwc-button";
import { Dialog } from "@material/mwc-dialog";
import "@material/mwc-switch";
import "@material/mwc-formfield";
import "@material/mwc-top-app-bar-fixed";
import "@material/mwc-menu";
import "@material/mwc-list/mwc-list-item";
import "@authentic/mwc-circular-progress";
import { TextFieldBase } from "@material/mwc-textfield/mwc-textfield-base";

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
import {
  connectToConductors,
  checkConnection,
} from "../processors/connect-to-conductors";
import { Header } from "../types/header";

export class HolochainPlayground extends LitElement {
  @query("#file-upload")
  fileUpload: HTMLInputElement;

  @query("#stats")
  stats: any;

  @property({ type: Object })
  playground: Playground;

  @property({ type: Array })
  conductorUrls: string[] | undefined = undefined;

  @property({ type: Array, attribute: false })
  _conductorUrls: string[] | undefined = undefined;

  @property({ type: Array, attribute: false })
  dialogConductorUrls: string[] | undefined = undefined;

  @property({ type: Boolean })
  technicalMode: boolean = false;

  @property({ type: Object })
  blackboard: Blackboard<Playground>;

  urlsState = {};

  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-top-app-bar-fixed mwc-button,
        mwc-top-app-bar-fixed mwc-formfield,
        mwc-top-app-bar-fixed mwc-switch {
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
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    if (changedValues.has("conductorUrls")) {
      this._conductorUrls = this.conductorUrls;
    }
    if (changedValues.has("_conductorUrls")) {
      connectToConductors(this.blackboard, this._conductorUrls);
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
          "activeAgentId",
          conductor.cells[this.blackboard.state.activeDNA].agentId
        );
      }
    }
  }

  setConnectionValidity(element) {
    element.validityTransform = (newValue, nativeValidity) => {
      let valid = false;

      switch (this.urlsState[newValue]) {
        case "resolved":
          element.setCustomValidity("");
          valid = true;
          break;
        case "rejected":
          element.setCustomValidity("Could not connect to node");
          break;
        default:
          element.setCustomValidity("Checking connection...");
          break;
      }

      this.requestUpdate();
      return { valid };
    };
  }

  getUrlFields(): TextFieldBase[] {
    return Array.apply(null, this.shadowRoot.querySelectorAll(".url-field"));
  }

  updateFields() {
    const fields = this.getUrlFields();
    this.dialogConductorUrls = fields.map((f) => f.value);
    for (const field of fields) {
      this.setConnectionValidity(field);

      if (!this.urlsState[field.value]) {
        try {
          checkConnection(field.value)
            .then(() => (this.urlsState[field.value] = "resolved"))
            .catch(() => (this.urlsState[field.value] = "rejected"))
            .finally(() => {
              field.reportValidity();
            });
        } catch (e) {
          this.urlsState[field.value] = "rejected";
          field.reportValidity();
        }
      }
      field.reportValidity();
    }
  }

  renderConnectToNodes() {
    return html`<mwc-dialog id="connect-to-nodes">
      <div class="column">
        <h3 class="title">${
          this._conductorUrls ? "Connected Nodes" : "Connect to nodes"
        }</h3>
        ${
          this.dialogConductorUrls
            ? this.dialogConductorUrls.map(
                (url, index) => html`
                  <div class="row">
                    <mwc-textfield
                      style="margin-bottom: 16px;"
                      class="url-field"
                      outlined
                      .disabled=${!!this.conductorUrls}
                      label="Conductor url"
                      value=${url}
                      @input=${() => this.updateFields()}
                    ></mwc-textfield>
                    ${this.conductorUrls
                      ? html``
                      : html`
                          <mwc-icon-button
                            icon="clear"
                            @click=${() => {
                              this.dialogConductorUrls.splice(index, 1);
                              this.dialogConductorUrls = [
                                ...this.dialogConductorUrls,
                              ];
                              setTimeout(() => this.updateFields());
                            }}
                          ></mwc-icon-button>
                        `}
                  </div>
                `
              )
            : html``
        }
        ${
          this.conductorUrls
            ? html``
            : html`
                <mwc-button
                  label="Add node"
                  icon="add"
                  @click=${() => {
                    this.dialogConductorUrls = [
                      ...this.dialogConductorUrls,
                      "",
                    ];
                    setTimeout(() => this.updateFields());
                  }}
                >
                </mwc-button>
              `
        }
        </mwc-button>
      </div>

      <mwc-button
        slot="primaryAction"
        dialogAction="confirm"
        label=${
          this.conductorUrls
            ? "Ok"
            : this._conductorUrls
            ? "Update connections"
            : "Connect to nodes"
        }
        .disabled=${
          this.getUrlFields().length === 0 ||
          !this.getUrlFields().every((field) => field.validity.valid)
        }
        @click=${() => (this._conductorUrls = this.dialogConductorUrls)}
      >
      </mwc-button>
    </mwc-dialog>`;
  }

  render() {
    if (!this.blackboard || !this.blackboard.state)
      return html`<div class="row fill center-content">
        <mwc-circular-progress></mwc-circular-progress>
      </div>`;

    return html`
      ${this.renderConnectToNodes()}
      <blackboard-container .blackboard=${this.blackboard} class="fill column">
        <mwc-top-app-bar-fixed>
          <span slot="title">DNA: ${this.blackboard.state.activeDNA}</span>

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
            label=${this._conductorUrls
              ? "CONNECTED NODES"
              : "CONNECT TO NODES"}
            icon=${this._conductorUrls ? "sync" : "sync_disabled"}
            @click=${() => {
              this.dialogConductorUrls = this._conductorUrls || [
                "ws://localhost:8888",
              ];
              (this.shadowRoot.getElementById(
                "connect-to-nodes"
              ) as Dialog).open = true;

              setTimeout(() => {
                this.updateFields();
                this.requestUpdate();
              });
            }}
          ></mwc-button>

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
