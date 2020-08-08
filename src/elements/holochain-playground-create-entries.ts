import { LitElement, html, property, query, css } from 'lit-element';
import '@material/mwc-textarea';
import '@material/mwc-button';
import '@material/mwc-textfield';
import '@material/mwc-dialog';
import '@material/mwc-radio';
import '@material/mwc-formfield';
import { sharedStyles } from './sharedStyles';
import { Cell } from '../types/cell';
import { TextArea } from '@material/mwc-textarea';
import { TextFieldBase } from '@material/mwc-textfield/mwc-textfield-base';
import { EntryType, Entry, hashEntry } from '../types/entry';

import '@alenaksu/json-viewer';
import { entryToDHTOps, neighborhood } from '../types/dht-op';
import { Playground } from '../state/playground';
import { blackboardConnect } from '../blackboard/blackboard-connect';
import {
  selectActiveCell,
  selectEntry,
  selectActiveCells,
} from '../state/selectors';

export class CreateEntries extends blackboardConnect<Playground>(
  'holochain-playground',
  LitElement
) {
  @property({ attribute: false })
  private selectedEntryType: number = 0;

  @query('#create-entry-textarea')
  private createTextarea: TextArea;
  @query('#create-entry-type')
  private createType: TextFieldBase;

  @query('#update-entry-textarea')
  private updateTextarea: TextArea;
  @query('#update-entry-address')
  private updateAddress: TextFieldBase;

  @query('#remove-entry-address')
  private removeAddress: TextFieldBase;

  @query('#add-from-address')
  private addFromAddress: TextFieldBase;
  @query('#add-to-address')
  private addToAddress: TextFieldBase;
  @query('#add-type')
  private addType: TextFieldBase;
  @query('#add-tag')
  private addTag: TextFieldBase;

  @query('#remove-from-address')
  private removeFromAddress: TextFieldBase;
  @query('#remove-to-address')
  private removeToAddress: TextFieldBase;
  @query('#remove-type')
  private removeType: TextFieldBase;
  @query('#remove-timestamp')
  private removeTimestamp: TextFieldBase;

  @property({ attribute: false })
  private entryToCreate: { entry: Entry; replaces?: string } | undefined = undefined;

  setEntryValidity(element) {
    element.validityTransform = (newValue, nativeValidity) => {
      this.requestUpdate();
      if (newValue.length === 46) {
        const entry = selectEntry(this.blackboard.state)(newValue);
        if (entry) return { valid: true };
      }
      element.setCustomValidity('Entry does not exist');
      return {
        valid: false,
      };
    };
  }

  setNonEmptyValidity(element) {
    element.validityTransform = (newValue, nativeValidity) => {
      this.requestUpdate();
      if (newValue.length === 0) {
        element.setCustomValidity('Type must not be empty');
        return { valid: false };
      }
      return {
        valid: true,
      };
    };
  }

  setJsonValidity(element) {
    element.validityTransform = (newValue, nativeValidity) => {
      if (newValue === '') return { valid: false };
      try {
        const json = JSON.parse(newValue);
        element.setCustomValidity('');

        this.requestUpdate();
        return {
          valid: true,
        };
      } catch (e) {
        element.setCustomValidity('Bad JSON input');
        this.requestUpdate();
        return { valid: false };
      }
    };
  }

  firstUpdated() {
    if (this.blackboard.state.conductorsUrls !== undefined) return;

    this.setJsonValidity(this.createTextarea);
    this.setJsonValidity(this.updateTextarea);
    this.setEntryValidity(this.updateAddress);
    this.setEntryValidity(this.removeAddress);
    this.setEntryValidity(this.addFromAddress);
    this.setEntryValidity(this.addToAddress);
    this.setEntryValidity(this.removeFromAddress);
    this.setEntryValidity(this.removeToAddress);
    this.setNonEmptyValidity(this.createType);
    this.setNonEmptyValidity(this.addType);
    [
      this.createTextarea,
      this.updateTextarea,
      this.updateAddress,
      this.removeAddress,
      this.addFromAddress,
      this.addToAddress,
      this.removeFromAddress,
      this.removeToAddress,
    ].forEach((ele) => ele['formElement'] && ele.setCustomValidity(''));
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
        }
        hr {
          width: 100%;
          opacity: 0.3;
          margin-top: 20px;
          margin-bottom: 20px;
        }
        mwc-textfield,
        mwc-textarea {
          margin-bottom: 16px;
        }
        mwc-textarea {
          width: 100%;
        }
      `,
    ];
  }

  renderCreateEntry() {
    return html`
      <div
        class="column"
        style=${this.selectedEntryType === 0 ? '' : 'display: none;'}
      >
        <h3>Create Entry</h3>
        <div class="column center-content">
          <mwc-textfield
            outlined
            id="create-entry-type"
            label="Entry Type"
            style="width: 15em"
            @input=${() => this.createType.reportValidity()}
          ></mwc-textfield>
          <mwc-textarea
            outlined
            id="create-entry-textarea"
            style="flex: 1;"
            fullwidth
            required
            @input=${() => this.createTextarea.reportValidity()}
            placeholder="Input JSON of entry"
          ></mwc-textarea>
          <mwc-button
            raised
            label="CREATE"
            .disabled=${!(
              this.createTextarea &&
              this.createTextarea.validity.valid &&
              this.createType &&
              this.createType.validity.valid
            )}
            @click=${() =>
              (this.entryToCreate = {
                entry: {
                  type: EntryType.CreateEntry,
                  payload: {
                    content: JSON.parse(this.createTextarea.value),
                    type: this.createType.value,
                  },
                },
              })}
          ></mwc-button>
        </div>
      </div>
    `;
  }

  renderUpdateEntry() {
    return html`
      <div
        class="column"
        style=${this.selectedEntryType === 1 ? '' : 'display: none;'}
      >
        <h3>Update Entry</h3>
        <div class="column center-content">
          <mwc-textarea
            outlined
            id="update-entry-textarea"
            style="flex: 1;"
            fullwidth
            required
            @input=${() => this.updateTextarea.reportValidity()}
            placeholder="Input JSON of entry"
          ></mwc-textarea>
          <mwc-textfield
            outlined
            id="update-entry-address"
            label="Entry to update"
            style="width: 35em"
            @input=${() => this.updateAddress.reportValidity()}
          ></mwc-textfield>
          <mwc-button
            raised
            label="UPDATE"
            .disabled=${!(
              this.updateTextarea &&
              this.updateTextarea.validity.valid &&
              this.updateAddress &&
              this.updateAddress.validity.valid
            )}
            @click=${() =>
              (this.entryToCreate = {
                entry: {
                  type: EntryType.CreateEntry,
                  payload: {
                    content: JSON.parse(this.updateTextarea.value),
                    type: selectEntry(this.blackboard.state)(this.updateAddress.value)
                      .payload.type,
                  },
                },
                replaces: this.updateAddress.value,
              })}
          ></mwc-button>
        </div>
      </div>
    `;
  }

  renderRemoveEntry() {
    return html`
      <div
        class="column"
        style=${this.selectedEntryType === 2 ? '' : 'display: none;'}
      >
        <h3>Remove Entry</h3>
        <div class="column center-content">
          <mwc-textfield
            outlined
            id="remove-entry-address"
            label="Entry address to remove"
            style="width: 35em"
            @input=${() => this.removeAddress.reportValidity()}
          ></mwc-textfield>
          <mwc-button
            raised
            label="REMOVE"
            .disabled=${!(
              this.removeAddress && this.removeAddress.validity.valid
            )}
            @click=${() =>
              (this.entryToCreate = {
                entry: {
                  type: EntryType.RemoveEntry,
                  payload: { deletedEntry: this.removeAddress.value },
                },
              })}
          ></mwc-button>
        </div>
      </div>
    `;
  }

  renderLinkEntries() {
    return html`
      <div
        class="column"
        style=${this.selectedEntryType === 3 ? '' : 'display: none;'}
      >
        <h3>Link Entries</h3>
        <div class="column center-content">
          <mwc-textfield
            outlined
            id="add-from-address"
            label="Base entry address"
            style="width: 35em"
            @input=${() => this.addFromAddress.reportValidity()}
          ></mwc-textfield>
          <mwc-textfield
            outlined
            id="add-to-address"
            label="Target entry address"
            @input=${() => this.addToAddress.reportValidity()}
            style="width: 35em"
          ></mwc-textfield>
          <mwc-textfield
            outlined
            id="add-type"
            label="Link type"
            style="width: 35em"
            @input=${() => this.addType.reportValidity()}
          ></mwc-textfield>
          <mwc-textfield
            outlined
            id="add-tag"
            label="Tag of the link"
            style="width: 35em"
          ></mwc-textfield>
          <mwc-button
            raised
            label="LINK"
            .disabled=${!(
              this.addFromAddress &&
              this.addFromAddress.validity.valid &&
              this.addToAddress &&
              this.addToAddress.validity.valid &&
              this.addType &&
              this.addType.validity.valid
            )}
            @click=${() =>
              (this.entryToCreate = {
                entry: {
                  type: EntryType.LinkAdd,
                  payload: {
                    base: this.addFromAddress.value,
                    target: this.addToAddress.value,
                    type: this.addType.value,
                    tag: this.addTag.value,
                  },
                },
              })}
          ></mwc-button>
        </div>
      </div>
    `;
  }

  renderRemoveLink() {
    return html`
      <div
        class="column"
        style=${this.selectedEntryType === 4 ? '' : 'display: none;'}
      >
        <h3>Remove Link</h3>
        <div class="column center-content">
          <mwc-textfield
            outlined
            id="remove-from-address"
            label="Base entry address"
            style="width: 35em"
            @input=${() => {
              this.removeFromAddress.reportValidity();
              this.requestUpdate();
            }}
          ></mwc-textfield>
          <mwc-textfield
            outlined
            id="remove-to-address"
            label="Target entry address"
            @input=${() => {
              this.removeToAddress.reportValidity();
              this.requestUpdate();
            }}
            style="width: 35em"
          ></mwc-textfield>
          <mwc-textfield
            outlined
            id="remove-type"
            label="Link type"
            style="width: 35em"
          ></mwc-textfield>
          <mwc-textfield
            outlined
            id="remove-timestamp"
            label="Timestamp of the link"
            style="width: 35em"
          ></mwc-textfield>
          <mwc-button
            raised
            label="REMOVE LINK"
            .disabled=${!(
              this.removeFromAddress &&
              this.removeFromAddress.validity.valid &&
              this.removeToAddress &&
              this.removeToAddress.validity.valid
            )}
            @click=${() =>
              (this.entryToCreate = {
                entry: {
                  type: EntryType.LinkRemove,
                  payload: {
                    base: this.removeFromAddress.value,
                    target: this.removeToAddress.value,
                    type: this.removeType.value,
                    timestamp: parseInt(this.removeTimestamp.value),
                  },
                },
              })}
          ></mwc-button>
        </div>
      </div>
    `;
  }

  cell() {
    let cell = selectActiveCell(this.blackboard.state);
    if (!cell) {
      cell = selectActiveCells(this.blackboard.state)[0];
    }
    return cell;
  }

  async buildDHTOpsTransforms() {
    const hash = await hashEntry(this.entryToCreate.entry);
    const newHeader = this.cell().newHeader(hash, this.entryToCreate.replaces);

    const dhtOps = await entryToDHTOps(this.entryToCreate.entry, newHeader);

    return dhtOps.map((dhtOp) => ({
      operation: dhtOp,
      neighborhood: neighborhood(dhtOp),
    }));
  }

  renderCommitDialog() {
    return html`
      <mwc-dialog
        .open=${!!this.entryToCreate}
        heading="Commit new entry"
        @closed=${() => (this.entryToCreate = undefined)}
      >
        <div>
          This will create these DHT Operations on the given neighborhoods
        </div>

        <json-viewer .data=${this.buildDHTOpsTransforms()}></json-viewer>

        <mwc-button
          slot="secondaryAction"
          dialogAction="cancel"
          @click=${() => (this.entryToCreate = undefined)}
        >
          Cancel
        </mwc-button>
        <mwc-button
          slot="primaryAction"
          dialogAction="confirm"
          @click=${() => this.createEntry()}
        >
          Commit entry
        </mwc-button>
      </mwc-dialog>
    `;
  }

  createEntry() {
    this.cell().createEntry(
      this.entryToCreate.entry,
      this.entryToCreate.replaces
    );
    const entryId = hashEntry(this.entryToCreate.entry);
    this.dispatchEvent(
      new CustomEvent('entry-committed', {
        detail: {
          entryId,
        },
        bubbles: true,
        composed: true,
      })
    );
    this.blackboard.update('activeEntryId', entryId);
    this.entryToCreate = undefined;
  }

  renderSelectCommitType() {
    return html`
      <div class="column" style="margin-right: 16px;">
        <h3 style="margin-block-end: 0.7em;">Commit type</h3>
        <mwc-formfield label="Create Entry">
          <mwc-radio
            name="entryType"
            checked
            @change=${() => (this.selectedEntryType = 0)}
          ></mwc-radio>
        </mwc-formfield>
        <mwc-formfield label="Update Entry">
          <mwc-radio
            name="entryType"
            @change=${() => (this.selectedEntryType = 1)}
          ></mwc-radio>
        </mwc-formfield>
        <mwc-formfield label="Remove Entry">
          <mwc-radio
            name="entryType"
            @change=${() => (this.selectedEntryType = 2)}
          ></mwc-radio>
        </mwc-formfield>
        <mwc-formfield label="Link Entries">
          <mwc-radio
            name="entryType"
            @change=${() => (this.selectedEntryType = 3)}
          ></mwc-radio>
        </mwc-formfield>
        <mwc-formfield label="Remove Links">
          <mwc-radio
            name="entryType"
            @change=${() => (this.selectedEntryType = 4)}
          ></mwc-radio>
        </mwc-formfield>
      </div>
    `;
  }

  renderConnectedPlaceholder() {
    return html`<div class="row fill center-content">
      <span class="placeholder"
        >Cannot create when connected to real conductors</span
      >
    </div>`;
  }

  render() {
    return html`
      <div class="column fill">
        ${this.blackboard.state.conductorsUrls !== undefined
          ? this.renderConnectedPlaceholder()
          : html`
              <div class="row fill">
                ${this.entryToCreate ? this.renderCommitDialog() : html``}
                ${this.renderSelectCommitType()}

                <div class="fill" style="padding: 0 24px;">
                  ${this.renderCreateEntry()} ${this.renderUpdateEntry()}
                  ${this.renderRemoveEntry()} ${this.renderLinkEntries()}
                  ${this.renderRemoveLink()}
                </div>
              </div>
            `}
      </div>
    `;
  }
}

customElements.define('holochain-playground-create-entries', CreateEntries);
