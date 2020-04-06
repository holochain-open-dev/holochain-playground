import { pinToBoard } from "../blackboard/blackboard-mixin";
import { Playground } from "../state/playground";
import { LitElement, query, html, property, css } from "lit-element";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";
import "@material/mwc-checkbox";
import { allEntries } from "../processors/graph";
import { selectActiveCells } from "../state/selectors";
import { sharedStyles } from "./sharedStyles";

cytoscape.use(cola);

export class EntryGraph extends pinToBoard<Playground>(LitElement) {
  @property({ attribute: false })
  showAgentsIds: boolean = true;

  @query("#entry-graph")
  entryGraph: HTMLElement;

  lastEntriesIds: string[] = [];
  cy;

  firstUpdated() {
    this.cy = cytoscape({
      container: this.entryGraph,
      boxSelectionEnabled: false,
      autoungrabify: true,
      userZoomingEnabled: false,
      userPanningEnabled: false,
      layout: { name: "cola" },
      style: `
              node {
                background-color: grey;
                font-size: 6px;
                width: 15px;
                height: 15px;
              }
      
              edge {
                label: data(label);
                width: 2;
                target-arrow-shape: triangle;
                curve-style: bezier;
              }
              
              edge[label] {
                font-size: 4px;
                text-rotation: autorotate;
                text-margin-x: 0px;
                text-margin-y: -5px;
                text-valign: top;
                text-halign: center;        
              }
      
              .selected {
                border-width: 2px;
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
      
              .implicit {
                width: 1;
                line-style: dotted;
              }

              .update-link {
                width: 1;
                line-style: dashed;
              }
              .updated {
                opacity: 0.5;
              }
              .deleted {
                opacity: 0.3;
              }
            `,
    });

    this.cy.on("tap", "node", (event) => {
      const selectedEntryId = event.target.id();
      this.blackboard.update("activeEntryId", selectedEntryId);
    });

    this.cy.ready((e) => setTimeout(() => this.updatedGraph(), 150));
  }

  updated(changedValues) {
    super.updated(changedValues);
    this.updatedGraph();
  }

  vectorsEqual(v1: string[], v2: string[]) {
    if (v1.length !== v2.length) return false;
    v1 = v1.sort();
    v2 = v2.sort();
    for (let i = 0; i < v1.length; i++) {
      if (v1[i] !== v2[i]) return false;
    }
    return true;
  }

  updatedGraph() {
    if (this.entryGraph.getBoundingClientRect().width === 0) return null;

    const entries = allEntries(
      selectActiveCells(this.state),
      this.showAgentsIds
    );

    if (
      !this.vectorsEqual(
        this.lastEntriesIds,
        entries.map((e) => e.data.id)
      )
    ) {
      this.cy.remove("nodes");
      this.cy.add(entries);
      const layout = this.cy.layout({ name: "cola", fit: true }).run();
    }

    this.lastEntriesIds = entries.map((e) => e.data.id);

    this.cy.filter("node").removeClass("selected");
    this.cy.getElementById(this.state.activeEntryId).addClass("selected");
  }

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

  render() {
    return html`
      <mwc-card style="width: auto;" class="fill">
        <div id="entry-graph" class="fill"></div>

        <div class="row" style="align-items: end">
          <mwc-formfield label="Show all AgentId entries">
            <mwc-checkbox
              checked
              @change=${() => (this.showAgentsIds = !this.showAgentsIds)}
            ></mwc-checkbox
          ></mwc-formfield>
        </div>
      </mwc-card>
    `;
  }
}
