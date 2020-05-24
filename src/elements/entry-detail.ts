import { LitElement, html, property, css } from 'lit-element';

import { pinToBoard } from '../blackboard/blackboard-mixin';
import { Playground } from '../state/playground';
import { sharedStyles } from './sharedStyles';
import { selectActiveEntry, selectEntryMetadata } from '../state/selectors';

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

  shorten(object: any, length: number) {
    if (object && typeof object === 'object') {
      object = { ...object };
      for (const key of Object.keys(object)) {
        object[key] = this.shorten(object[key], length);
      }
    } else if (typeof object === 'string' && object.length > length + 3) {
      return (object as string).substring(0, length) + '...';
    }
    return object;
  }

  render() {
    return html`
      <div class="column fill">
        <h3 class="title">Entry Detail</h3>
        ${selectActiveEntry(this.state)
          ? html`
              <div class="column">
                <strong style="margin-bottom: 8px;">
                  ${selectActiveEntry(this.state).entry_address
                    ? 'Header'
                    : 'Entry'}
                  Id
                </strong>
                <span style="margin-bottom: 16px;">
                  ${this.shorten(this.state.activeEntryId, 50)}
                </span>
                <json-viewer
                  .data=${this.shorten(selectActiveEntry(this.state), 40)}
                ></json-viewer>
                ${this.withMetadata
                  ? html` <span style="margin: 16px 0; font-weight: bold;">
                        Metadata
                      </span>
                      <json-viewer
                        .data=${this.shorten(
                          selectEntryMetadata(this.state)(
                            this.state.activeEntryId
                          ),
                          40
                        )}
                      ></json-viewer>`
                  : html``}
              </div>
            `
          : html`
              <div class="column fill center-content">
                <span class="placeholder">Select entry to inspect</span>
              </div>
            `}
      </div>
    `;
  }
}
