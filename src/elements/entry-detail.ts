import { LitElement, html, property, css } from "lit-element";

import { pinToBoard } from "../blackboard/blackboard-mixin";
import { Playground } from "../state/playground";
import { sharedStyles } from "./sharedStyles";
import { selectActiveEntry, selectEntryMetadata } from "../state/selectors";

export class EntryDetail extends pinToBoard<Playground>(LitElement) {
  @property({ type: Boolean })
  withMetadata = false;

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
      ${selectActiveEntry(this.state)
        ? html`
            <div class="column">
              <strong style="margin-bottom: 8px;">
                ${selectActiveEntry(this.state).entry_address
                  ? "Header"
                  : "Entry"}
                Id
              </strong>
              <span style="margin-bottom: 16px;"
                >${this.state.activeEntryId}</span
              >
              <json-viewer .data=${selectActiveEntry(this.state)}></json-viewer>
              ${this.withMetadata
                ? html` <span style="margin: 16px 0; font-weight: bold;"
                      >Metadata</span
                    >
                    <json-viewer
                      .data=${selectEntryMetadata(this.state)(
                        this.state.activeEntryId
                      )}
                    ></json-viewer>`
                : html``}
            </div>
          `
        : html`
            <div class="column fill center-content">
              <span>Select entry to inspect</span>
            </div>
          `}
    `;
  }
}
