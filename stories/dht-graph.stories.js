import '../dist/elements/holochain-playground-container.js';
import '../dist/elements/holochain-playground-dht-graph.js';

import {
  array,
  boolean,
  button,
  color,
  date,
  select,
  withKnobs,
  text,
  number,
} from '@storybook/addon-knobs';
import { html } from 'lit-element';
import { withWebComponentsKnobs } from 'storybook-addon-web-components-knobs';

export default {
  title: 'DHT Graph',
  component: 'holochain-playground-dht-graph',

  decorators: [withKnobs, withWebComponentsKnobs],
  parameters: { options: { selectedPanel: 'storybookjs/knobs/panel' } },
};

export const Simple = () => {
  return html`
    <holochain-playground-container>
      <holochain-playground-dht-graph
        style="height: 100vh"
      ></holochain-playground-dht-graph>
    </holochain-playground-container>
  `;
};
