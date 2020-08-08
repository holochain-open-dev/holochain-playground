import { LitElement, property, html, PropertyValues, css } from 'lit-element';
import { sourceChainNodes } from '../processors/graph';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import { isEqual } from 'lodash-es';

import { sharedStyles } from './sharedStyles';
import { Playground } from '../state/playground';
import { blackboardConnect } from '../blackboard/blackboard-connect';
import { selectActiveCell, selectActiveEntry } from '../state/selectors';
cytoscape.use(dagre); // register extension

export class SourceChain extends blackboardConnect<Playground>(
  'holochain-playground',
  LitElement
) {
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

  private cy: cytoscape.Core;

  private nodes: any[] = [];

  firstUpdated() {
    this.cy = cytoscape({
      container: this.shadowRoot.getElementById('source-chain-graph'),
      layout: { name: 'dagre' },
      autoungrabify: true,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      style: `
        node {
          width: 30px;
          height: 30px;
          font-size: 10px;
          label: data(label);
          background-color: grey;
          text-halign: right;
          text-valign: center;
          text-margin-x: 4px;
        }

        .header {
          text-margin-x: -5px;
          text-halign: left;
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
    this.cy.on('tap', 'node', (event) => {
      const selectedEntryId = event.target.id();
      this.blackboard.update('activeEntryId', selectedEntryId);
    });
    this.requestUpdate();
  }

  updated(changedValues: PropertyValues) {
    super.updated(changedValues);

    const nodes = sourceChainNodes(selectActiveCell(this.blackboard.state));
    if (!isEqual(nodes, this.nodes)) {
      this.nodes = nodes;

      this.cy.remove('nodes');
      this.cy.add(nodes);
      this.cy.layout({ name: 'dagre' }).run();
    }

    this.cy.filter('node').removeClass('selected');

    this.cy.getElementById(this.blackboard.state.activeEntryId).addClass('selected');
  }

  render() {
    return html`
      <div style="width: 400px; height: 95%;" id="source-chain-graph"></div>
    `;
  }
}

customElements.define('holochain-playground-source-chain', SourceChain);
