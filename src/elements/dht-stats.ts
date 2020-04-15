import { pinToBoard } from "../blackboard/blackboard-mixin";
import { Playground } from "../state/playground";
import { LitElement, html, query, property } from "lit-element";
import {
  selectCellCount,
  selectGlobalDHTOps,
  selectUniqueDHTOps,
  selectActiveCells,
} from "../state/selectors";
import { sharedStyles } from "./sharedStyles";
import { createConductors } from "../processors/create-conductors";
import { Dialog } from "@material/mwc-dialog";
import { TextFieldBase } from "@material/mwc-textfield/mwc-textfield-base";
import "@material/mwc-linear-progress";

export class DHTStats extends pinToBoard<Playground>(LitElement) {
  @query("#stats-help")
  statsHelp: Dialog;
  @query("#number-of-nodes")
  nNodes: TextFieldBase;
  @query("#r-factor")
  rFactor: TextFieldBase;

  timeout;
  @property({ type: Boolean })
  processing: boolean = false;

  static get styles() {
    return sharedStyles;
  }

  renderStatsHelp() {
    return html`
      <mwc-dialog id="stats-help" heading="DHT Statistics Help">
        <span>
          This panel contains statistics for the current state of the DHT.
          <br />
          <br />
          Having a redundancy factor of ${this.state.redundancyFactor}, it will
          <strong>
            replicate every DHT Op in the ${this.state.redundancyFactor} nodes
            that are closest to its neighborhood </strong
          >.
          <br />
          <br />
          The number of
          <strong
            >DHT Ops (DHT Operation Transforms) is a measure of the load that
            the DHT has to hold</strong
          >. A DHT Op is the command that a node receives to indicate it has to
          change something in its shard of the DHT. Example of DHT Ops are
          "StoreEntry", "RegisterAddLink".
        </span>
        <mwc-button slot="primaryAction" dialogAction="cancel">
          Got it!
        </mwc-button>
      </mwc-dialog>
    `;
  }

  async republish() {
    const newNodes = parseInt(this.nNodes.value);
    const currentNodes = selectCellCount(this.state);
    const changedNodes = currentNodes !== newNodes;

    const rFactor = parseInt(this.rFactor.value);

    if (newNodes > currentNodes) {
      const newNodesToCreate = newNodes - currentNodes;
      const conductors = createConductors(
        newNodesToCreate,
        this.state.conductors,
        rFactor,
        this.state.activeDNA
      );

      this.blackboard.update("conductors", conductors);
    } else if (newNodes < currentNodes) {
      const conductorsToRemove = currentNodes - newNodes;
      const sortedConductors = this.state.conductors.sort((c1, c2) => c1.cells[this.state.activeDNA].sourceChain.length - c2.cells[this.state.activeDNA].sourceChain.length)

      sortedConductors.splice(0, conductorsToRemove);

      this.blackboard.update("conductors", sortedConductors);
    }

    if (changedNodes || this.state.redundancyFactor !== rFactor) {
      const cells = selectActiveCells(this.state);
      for (const cell of cells) {
        cell.DHTOpTransforms = {};
        cell.redundancyFactor = rFactor;
      }
      for (const cell of cells) {
        cell.republish();
      }
    }

    this.blackboard.update("redundancyFactor", rFactor);
    this.processing = false;
  }

  updateDHTStats() {
    this.processing = true;
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.republish();
    }, 400);
  }

  render() {
    return html`
      ${this.renderStatsHelp()}
      <div class="column" style="position: relative;">
        <div style="padding: 16px;">
          <h3 class="title">Global DHT Stats</h3>

          <mwc-icon-button
            style="position: absolute; right: 8px; top: 8px;"
            icon="help_outline"
            @click=${() => (this.statsHelp.open = true)}
          ></mwc-icon-button>

          <div class="row center-content">
            <div class="row center-content" style="padding-right: 16px;">
              <span style="margin-right: 8px;">Number of nodes: </span
              ><mwc-textfield
                id="number-of-nodes"
                min="1"
                max="50"
                type="number"
                style="width: 5em;"
                .disabled=${this.state.connected}
                @change=${() => this.updateDHTStats()}
                .value=${selectCellCount(this.state).toString()}
              ></mwc-textfield>
            </div>
            <div class="row center-content" style="padding-right: 24px;">
              <span style="margin-right: 8px;">Redundancy factor: </span
              ><mwc-textfield
                id="r-factor"
                min="1"
                max="50"
                type="number"
                .disabled=${this.state.connected}
                style="width: 5em;"
                @change=${() => this.updateDHTStats()}
                .value=${this.state.redundancyFactor.toString()}
              ></mwc-textfield>
            </div>
            <div class="column fill">
              <span style="margin-bottom: 6px;"
                >Global DHT Ops:
                <strong>${selectGlobalDHTOps(this.state)}</strong></span
              >
              <span
                >Unique DHT Ops:
                <strong>${selectUniqueDHTOps(this.state)}</strong></span
              >
            </div>
          </div>
        </div>
        ${this.processing
          ? html`<mwc-linear-progress indeterminate></mwc-linear-progress>`
          : html``}
      </div>
    `;
  }
}
