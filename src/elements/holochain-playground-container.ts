import { Snackbar } from '@material/mwc-snackbar';

import { blackboardProvider } from '../blackboard/blackboard-container';
import { LitElement, html, css, query, property } from 'lit-element';
import { Playground } from '../state/playground';
import { connectToConductors } from '../processors/connect-to-conductors';
import {
  serializePlayground,
  deserializePlayground,
} from '../processors/serialize';
import { Blackboard } from '../blackboard/blackboard';
import { buildPlayground } from '../processors/build-playground';
import { hash } from '../processors/hash';

export class PlaygroundContainer extends blackboardProvider<Playground>(
  'holochain-playground',
  LitElement
) {
  @property({ type: Object })
  initialPlayground: Playground;

  @query('#snackbar')
  snackbar: Snackbar;

  @property({ type: String })
  message: string | undefined;

  static get styles() {
    return css`
      :host {
        display: contents;
      }
    `;
  }

  buildInitialSimulatedPlayground() {
    return buildPlayground(hash('dna1'), 10);
  }

  firstUpdated() {
    let playground = this.initialPlayground;
    if (!this.initialPlayground.conductorsUrls) {
      playground = this.buildInitialSimulatedPlayground();
    }
    this.blackboard = new Blackboard(playground, {
      persistId: 'holochain-playground',
      serializer: serializePlayground,
      deserializer: deserializePlayground,
    });

    this.blackboard.select('conductorsUrls').subscribe(async (urls) => {
      if (urls !== undefined) {
        try {
          await connectToConductors(this.blackboard, urls);
        } catch (e) {
          console.error(e);
          this.showError('Error when connecting with the nodes');
        }
      }
    });
  }

  showError(error: string) {
    this.message = error;
    this.snackbar.show();
  }

  renderSnackbar() {
    return html`
      <mwc-snackbar id="snackbar" labelText=${this.message}>
        <mwc-icon-button icon="close" slot="dismiss"></mwc-icon-button>
      </mwc-snackbar>
    `;
  }

  render() {
    return html` ${this.renderSnackbar()}
      <slot></slot>`;
  }
}

customElements.define('holochain-playground-container', PlaygroundContainer);
