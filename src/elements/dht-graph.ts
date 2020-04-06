import { LitElement, html, query, css } from "lit-element";
import cytoscape from "cytoscape";
import { Dialog } from "@material/mwc-dialog";

import { dnaNodes } from "../processors/graph";
import { pinToBoard } from "../blackboard/blackboard-mixin";
import { Playground } from "../state/playground";
import { selectActiveCells, selectHoldingCells } from "../state/selectors";
import { DHTOp, DHTOpType } from "../types/dht-op";
import { sharedStyles } from "./sharedStyles";

export class DHTGraph extends pinToBoard<Playground>(LitElement) {
  @query("#graph")
  element: HTMLElement;

  @query("#dht-help")
  dhtHelp: Dialog;

  cy;

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

  async firstUpdated() {
    const nodes = dnaNodes(selectActiveCells(this.state));

    this.cy = cytoscape({
      container: this.shadowRoot.getElementById("graph"),
      boxSelectionEnabled: false,
      elements: nodes,
      autoungrabify: true,
      userPanningEnabled: false,
      userZoomingEnabled: false,
      layout: { name: "circle" },
      style: `
            node {
              background-color: grey;
              label: data(label);
              font-size: 20px;
              width: 30px;
              height: 30px;
            }
    
            .selected {
              border-width: 4px;
              border-color: black;
              border-style: solid;
            }
    
            .highlighted {
              background-color: yellow;
            }
    
            edge {
              width: 1;
              line-style: dotted;
            }
          `,
    });

    this.cy.on("tap", "node", (evt) => {
      this.blackboard.update("activeAgentId", evt.target.id());
      this.blackboard.update("activeEntryId", null);
    });

    this.addEventListener("entry-committed", (e: CustomEvent) => {
      this.requestUpdate();
      this.highlightNodesWithEntry(e.detail.entryId);
    });
  }

  highlightNodesWithEntry(entryId: string) {
    selectActiveCells(this.state).forEach((cell) =>
    this.cy.getElementById(cell.agentId).removeClass("highlighted")
    );
    const cells = selectHoldingCells(this.state)(entryId);
    
    for (const cell of cells) {
      this.cy.getElementById(cell.agentId).addClass("highlighted");
    }
  }

  updated(changedValues) {
    super.updated(changedValues);

    this.cy.remove("nodes");
    this.cy.add(dnaNodes(selectActiveCells(this.state)));
    this.cy.layout({ name: "circle" }).run();

    selectActiveCells(this.state).forEach((cell) =>
      this.cy.getElementById(cell.agentId).removeClass("selected")
    );
    this.cy.getElementById(this.state.activeAgentId).addClass("selected");

    this.highlightNodesWithEntry(this.state.activeEntryId)
  }

  renderDHTHelp() {
    return html`
      <mwc-dialog id="dht-help" heading="DHT Help">
        <span>
          This is a visual interactive representation of a holochain
          <a
            href="https://developer.holochain.org/docs/concepts/4_public_data_on_the_dht/"
            target="_blank"
            >DHT</a
          >, with ${this.state.conductors.length} nodes.
          <br />
          <br />
          In the DHT, all nodes have a <strong>public and private key</strong>.
          The public key is visible and shared througout the network, but
          private keys never leave their nodes. This public key is of 256 bits
          an it's actually the node's ID, which you can see labeled besides the
          nodes (encoded in base58 strings).
          <br />
          <br />
          If you pay attention, you will see that
          <strong>all nodes in the DHT are ordered alphabetically</strong>. This
          is because the nodes organize themselves in neighborhoods: they are
          more connected with the nodes that are closest to their ID, and less
          connected with the nodes that are far.
        </span>
        <mwc-button slot="primaryAction" dialogAction="cancel">
          Got it!
        </mwc-button>
      </mwc-dialog>
    `;
  }

  render() {
    return html`${this.renderDHTHelp()}
      <div class="fill" style="position: relative">
        <div id="graph" style="height: 100%"></div>

        <mwc-icon-button
          style="position: absolute; right: 36px; top: 36px;"
          icon="help_outline"
          @click=${() => (this.dhtHelp.open = true)}
        ></mwc-icon-button>
      </div>`;
  }
}
