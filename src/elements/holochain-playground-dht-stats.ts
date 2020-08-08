import { blackboardConnect } from '../blackboard/blackboard-connect';
import { Playground } from '../state/playground';
import { LitElement, html, query, property } from 'lit-element';
import {
  selectCellCount,
  selectGlobalDHTOps,
  selectUniqueDHTOps,
  selectMedianHoldingDHTOps,
} from '../state/selectors';
import { sharedStyles } from './sharedStyles';
import { createConductors } from '../processors/create-conductors';
import { Dialog } from '@material/mwc-dialog';
import { TextFieldBase } from '@material/mwc-textfield/mwc-textfield-base';
import '@material/mwc-linear-progress';

export class DHTStats extends blackboardConnect<Playground>(
  'holochain-playground',
  LitElement
) {
  @query('#stats-help')
  private statsHelp: Dialog;
  @query('#number-of-nodes')
  private nNodes: TextFieldBase;
  @query('#r-factor')
  private rFactor: TextFieldBase;

  private timeout;
  @property({ type: Boolean })
  private processing: boolean = false;

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
          Having a redundancy factor of
          ${this.blackboard.state.redundancyFactor}, it will
          <strong>
            replicate every DHT Op in the
            ${this.blackboard.state.redundancyFactor} nodes that are closest to
            its neighborhood </strong
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
    const currentNodes = selectCellCount(this.blackboard.state);
    const changedNodes = currentNodes !== newNodes;

    const rFactor = parseInt(this.rFactor.value);
    const dna = this.blackboard.state.activeDNA;
    let conductors = this.blackboard.state.conductors;

    if (newNodes > currentNodes) {
      const newNodesToCreate = newNodes - currentNodes;
      conductors = await createConductors(
        newNodesToCreate,
        conductors,
        rFactor,
        dna
      );
    } else if (newNodes < currentNodes) {
      const conductorsToRemove = currentNodes - newNodes;
      conductors = conductors.sort(
        (c1, c2) =>
          c1.cells[dna].sourceChain.length - c2.cells[dna].sourceChain.length
      );

      conductors.splice(0, conductorsToRemove);
    }

    if (changedNodes) {
      const peers = conductors.map((c) => c.cells[dna].agentId);

      for (const conductor of conductors) {
        conductor.cells[dna].peers = peers.filter(
          (p) => p !== conductor.cells[dna].agentId
        );
      }
    }
    this.blackboard.update('conductors', conductors);

    if (changedNodes || this.blackboard.state.redundancyFactor !== rFactor) {
      const cells = conductors.map((c) => c.cells[dna]);
      for (const cell of cells) {
        cell.DHTOpTransforms = {};
        cell.redundancyFactor = rFactor;
      }
      for (const cell of cells) {
        cell.republish();
      }
    }

    this.blackboard.update('redundancyFactor', rFactor);
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
                outlined
                type="number"
                style="width: 5em;"
                .disabled=${this.blackboard.state.conductorsUrls !== undefined}
                @change=${() => this.updateDHTStats()}
                .value=${selectCellCount(this.blackboard.state).toString()}
              ></mwc-textfield>
            </div>
            <div class="row center-content" style="padding-right: 24px;">
              <span style="margin-right: 8px;">Redundancy factor: </span
              ><mwc-textfield
                id="r-factor"
                min="1"
                max="50"
                outlined
                type="number"
                .disabled=${this.blackboard.state.conductorsUrls !== undefined}
                style="width: 5em;"
                @change=${() => this.updateDHTStats()}
                .value=${this.blackboard.state.redundancyFactor.toString()}
              ></mwc-textfield>
            </div>
            <div class="column fill">
              <span style="margin-bottom: 2px;"
                >Unique DHT Ops:
                <strong
                  >${selectUniqueDHTOps(this.blackboard.state)}</strong
                ></span
              >
              <span style="margin-bottom: 2px;"
                >Median DHT Ops per node:
                <strong
                  >${selectMedianHoldingDHTOps(this.blackboard.state)}</strong
                ></span
              >
              <span
                >Global DHT Ops:
                <strong
                  >${selectGlobalDHTOps(this.blackboard.state)}</strong
                ></span
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

customElements.define('holochain-playground-dht-stats', DHTStats);
