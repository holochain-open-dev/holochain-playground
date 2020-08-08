import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-circular-progress';

import { blackboardContainer } from '../blackboard/blackboard-container';
import { LitElement, html, css, query, property } from 'lit-element';
import { Playground } from '../state/playground';
import { connectToConductors } from '../processors/connect-to-conductors';
import {
  serializePlayground,
  deserializePlayground,
} from '../processors/serialize';
import { Blackboard } from '../blackboard/blackboard';
import { buildPlayground } from '../processors/build-playground';

export class PlaygroundContainer extends blackboardContainer<Playground>(
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
    return buildPlayground('dna1', 10);
  }

  buildBlackboard() {
    return new Blackboard(null, {
      persistId: 'holochain-playground',
      serializer: serializePlayground,
      deserializer: deserializePlayground,
    });
  }

  firstUpdated() {
    if (!this.initialPlayground || !this.initialPlayground.conductorsUrls) {
      this.buildInitialSimulatedPlayground().then((playground) =>
        this.blackboard.updateState(playground)
      );
    }

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
    return html`
      ${this.renderSnackbar()}
      ${this.blackboard.state
        ? html` <slot></slot> `
        : html` <mwc-circular-progress></mwc-circular-progress>`}
    `;
  }
}

customElements.define('holochain-playground-container', PlaygroundContainer);
