const alias = require('@rollup/plugin-alias');
const { createDefaultConfig } = require('@open-wc/testing-karma');
const cjsTransformer = require('es-dev-commonjs-transformer');
const merge = require('deepmerge');
const { wrapRollupPlugin } = require('es-dev-server-rollup');

module.exports = (config) => {
  config.set(
    merge(createDefaultConfig(config), {
      browsers: ['ChromeHeadlessNoSandbox'],

      files: [
        // runs all files ending with .test in the test folder,
        // can be overwritten by passing a --grep flag. examples:
        //
        // npm run test -- --grep test/foo/bar.test.js
        // npm run test -- --grep test/bar/*
        {
          pattern: config.grep ? config.grep : 'test/**/*.test.js',
          type: 'module',
        },
      ],

      esm: {
        nodeResolve: {
          browser: true,
        },
        responseTransformers: [
          cjsTransformer([
            '**/node_modules/@open-wc/**/*',
            '**/node_modules/chai/**/*',
            '**/node_modules/chai-dom/**/*',
            '**/node_modules/sinon-chai/**/*',
          ]),
        ],
        plugins: [
          wrapRollupPlugin(
            alias({
              entries: [{ find: 'crypto', replacement: 'crypto-browserify' }],
            })
          ),
        ],
      },

      // you can overwrite/extend the config further
    })
  );
  return config;
};
