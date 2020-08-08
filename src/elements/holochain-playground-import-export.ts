import { blackboardConnect } from '../blackboard/blackboard-connect';
import { Playground } from '../state/playground';
import { LitElement, query, html } from 'lit-element';

import '@material/mwc-button';
import { downloadFile, fileToPlayground } from '../processors/files';

export class ImportExport extends blackboardConnect<Playground>(
  'holochain-playground',
  LitElement
) {
  @query('#file-upload')
  private fileUpload: HTMLInputElement;

  import() {
    const file = this.fileUpload.files[0];

    var reader = new FileReader();
    reader.onload = (event) => {
      const playground = JSON.parse(event.target.result as string);
      this.blackboard.updateState(fileToPlayground(playground));
    };
    reader.readAsText(file);
  }

  export() {
    const playground = this.blackboard.state;
    for (const conductor of playground.conductors) {
      for (const cell of Object.values(conductor.cells)) {
        cell.conductor = undefined;
      }
    }
    const blob = new Blob([JSON.stringify(playground)], {
      type: 'application/json',
    });

    downloadFile(
      `holochain-playground-${Date.now().toLocaleString()}.json`,
      blob
    );
  }

  render() {
    return html`
      <mwc-button
        label="Import"
        icon="publish"
        style="margin-right: 18px;"
        @click=${() => this.fileUpload.click()}
      ></mwc-button>
      <mwc-button
        label="Export"
        icon="get_app"
        style="margin-right: 18px;"
        @click=${() => this.export()}
      ></mwc-button>
      <input
        type="file"
        id="file-upload"
        accept="application/json"
        style="display:none"
        @change=${() => this.import()}
      />
    `;
  }
}

customElements.define('holochain-playground-import-export', ImportExport);
