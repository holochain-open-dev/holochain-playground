const commonjs = require('@rollup/plugin-commonjs');
const cjsTransformer = require('es-dev-commonjs-transformer');
const { wrapRollupPlugin } = require('es-dev-server-rollup');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');

module.exports = {
  // Globs of all the stories in your project
  stories: ['../stories/*.stories.{js,md}'],

  // Addons to be loaded, note that you need to import
  // them from storybook-prebuilt
  addons: [
    'storybook-prebuilt/addon-actions/register.js',
    'storybook-prebuilt/addon-knobs/register.js',
    'storybook-prebuilt/addon-a11y/register.js',
    'storybook-prebuilt/addon-docs/register.js',
  ],

  // Configuration for es-dev-server (start-storybook only)
  esDevServer: {
    nodeResolve: {
      browser: true,
      preferBuiltins: false,
    },
    open: true,
    responseTransformers: [
      cjsTransformer(
        /* Exclude Paths Array */ ['**/node_modules/@open-wc/**/*']
      ),
    ],
    plugins: [wrapRollupPlugin(globals()), wrapRollupPlugin(builtins())],
  },

  // Rollup build output directory (build-storybook only)
  outputDir: '../dist',
  // Configuration for rollup (build-storybook only)
  rollup: (config) => {
    return config;
  },
};
