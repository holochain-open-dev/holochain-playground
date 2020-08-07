import '../dist/elements/holochain-playground-container.js';
import '../dist/elements/holochain-playground-dht-shard.js';

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

export default {
  title: 'DHT Shard',
  decorators: [withKnobs],
};

export const Simple = () => {
  return html`
    <holochain-playground-container>
      <!-- <holochain-playground-dht-shard></holochain-playground-dht-shard> -->
    </holochain-playground-container>
  `;
};
