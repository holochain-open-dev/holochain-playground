import { LitElement, property, html, PropertyValues, css } from "lit-element";
import { sourceChainNodes } from "../processors/graph";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

import { sharedStyles } from "./sharedStyles";
import { Playground } from "../state/playground";
import { pinToBoard } from "../blackboard/blackboard-mixin";
import { selectActiveCell, selectActiveEntry } from "../state/selectors";
cytoscape.use(dagre); // register extension

export class SourceChain extends pinToBoard<Playground>(LitElement) {
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

  cy: cytoscape.Core;

  firstUpdated() {
    this.cy = cytoscape({
      container: this.shadowRoot.getElementById("source-chain-graph"),
      layout: { name: "dagre" },
      userPanningEnabled: false,
      autoungrabify: true,
      userZoomingEnabled: false,    
      style: `
        node {
          width: 30px;
          height: 30px;
          font-size: 8px;
          label: data(label);
          background-color: grey;
          text-halign: left;
          text-valign: center;
          text-margin-x: -5px;
        }

        edge {
          width: 4;
          target-arrow-shape: triangle;
          curve-style: bezier;
        }

        .selected {
          border-width: 4px;
          border-color: black;
          border-style: solid;
        }

        .DNA {
          background-color: green;
        }
        .AgentId {
          background-color: lime;
        }
        .CreateEntry {
          background-color: blue;
        }
        .RemoveEntry {
          background-color: red;
        }
        .UpdateEntry {
          background-color: cyan;
        }
        .LinkAdd {
          background-color: purple;
        }
        .LinkRemove {
          background-color: purple;
        }
      `,
    });
    this.cy.on("tap", "node", (event) => {
      const selectedEntryId = event.target.id();
      this.blackboard.update("activeEntryId", selectedEntryId);
    });
    this.requestUpdate();
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    this.cy.remove("nodes");
    this.cy.add(sourceChainNodes(selectActiveCell(this.state)));
    this.cy.layout({ name: "dagre" }).run();

    this.cy.filter("node").removeClass("selected");

    this.cy.getElementById(this.state.activeEntryId).addClass("selected");
  }

  render() {
    return html`
      <div class="row fill">
        <div style="width: 400px; height: 95%" id="source-chain-graph"></div>

        <entry-detail style="flex: 1"></entry-detail>
      </div>
    `;
  }
}
