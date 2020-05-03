import { pinToBoard } from '../blackboard/blackboard-mixin';
import { Playground } from '../state/playground';
import { LitElement, html, property } from 'lit-element';
import { TextFieldBase } from '@material/mwc-textfield/mwc-textfield-base';
import { checkConnection } from '../processors/connect-to-conductors';

export class ConnectToNodes extends pinToBoard<Playground>(LitElement) {
  @property({ type: Array })
  conductorUrls: string[] | undefined = ['ws://localhost:8888'];

  @property({ type: Boolean })
  open: Boolean = false;

  urlsState = {};

  firstUpdated() {
    if (this.state.conductorsUrls !== undefined) {
      this.conductorUrls = this.state.conductorsUrls;
    }
    this.blackboard.select('conductorsUrls').subscribe((urls) => {
      this.conductorUrls = urls;
    });
  }

  getUrlFields(): TextFieldBase[] {
    return Array.apply(null, this.shadowRoot.querySelectorAll('.url-field'));
  }

  setConnectionValidity(element) {
    element.validityTransform = (newValue, nativeValidity) => {
      let valid = false;

      switch (this.urlsState[newValue]) {
        case 'resolved':
          element.setCustomValidity('');
          valid = true;
          break;
        case 'rejected':
          element.setCustomValidity(
            'Could not connect to node, check admin interface'
          );
          break;
        default:
          element.setCustomValidity('Checking connection...');
          break;
      }

      this.requestUpdate();
      return { valid };
    };
  }

  updateFields() {
    const fields = this.getUrlFields();
    this.conductorUrls = fields.map((f) => f.value);
    for (const field of fields) {
      this.setConnectionValidity(field);

      if (!this.urlsState[field.value]) {
        try {
          checkConnection(field.value)
            .then(() => (this.urlsState[field.value] = 'resolved'))
            .catch(() => (this.urlsState[field.value] = 'rejected'))
            .finally(() => {
              field.reportValidity();
            });
        } catch (e) {
          this.urlsState[field.value] = 'rejected';
          field.reportValidity();
        }
      }
      field.reportValidity();
    }
  }

  render() {
    return html`<mwc-dialog
      id="connect-to-nodes"
      .open=${this.open}
      @closed=${() => (this.open = false)}
    >
      <div class="column">
        <h3 class="title">
          ${this.blackboard.state.conductorsUrls
            ? 'Connected Nodes'
            : 'Connect to nodes'}
        </h3>
        ${this.conductorUrls.map(
          (url, index) => html`
            <div class="row" style="margin-bottom: 16px;">
              <mwc-textfield
                style="width: 20em;"
                class="url-field"
                outlined
                label="Conductor url"
                value=${url}
                @input=${() => this.updateFields()}
              ></mwc-textfield>
              <mwc-icon-button
                icon="clear"
                .disabled=${this.conductorUrls.length === 1}
                style="padding-top: 4px;"
                @click=${() => {
                  this.conductorUrls.splice(index, 1);
                  this.conductorUrls = [...this.conductorUrls];
                  setTimeout(() => this.updateFields());
                }}
              ></mwc-icon-button>
            </div>
          `
        )}
        <mwc-button
          label="Add node"
          icon="add"
          @click=${() => {
            this.conductorUrls = [...this.conductorUrls, ''];
            setTimeout(() => this.updateFields());
          }}
        >
        </mwc-button>
      </div>

      <mwc-button
        slot="primaryAction"
        dialogAction="confirm"
        label=${this.conductorUrls
          ? 'Ok'
          : this.blackboard.state.conductorsUrls
          ? 'Update connections'
          : 'Connect to nodes'}
        .disabled=${this.getUrlFields().length === 0 ||
        !this.getUrlFields().every((field) => field.validity.valid)}
        @click=${() =>
          this.blackboard.update('conductorsUrls', this.conductorUrls)}
      >
      </mwc-button>
    </mwc-dialog>`;
  }
}
