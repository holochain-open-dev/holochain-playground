/* global window */

import {
  configure,
  addParameters,
  setCustomElements,
} from '@storybook/web-components';
import { withWebComponentsKnobs } from 'storybook-addon-web-components-knobs';

import customElements from '../custom-elements.json';

setCustomElements(customElements);

addParameters({
  a11y: {
    config: {},
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true,
    },
  },
});

// configure(require.context('../stories', true, /\.stories\.(js|mdx)$/), module);

// force full reload to not re-register web components
const req = require.context('../stories', true, /\.stories\.(js|mdx)$/);

configure(req, module);

if (module.hot) {
  module.hot.accept(req.id, () => {
    const currentLocationHref = window.location.href;
    window.history.pushState(null, null, currentLocationHref);
    window.location.reload();
  });
}
