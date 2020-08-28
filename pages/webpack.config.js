const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BaseHrefWebpackPlugin } = require('base-href-webpack-plugin');

function materialAliases(...materialLibs) {
  const aliases = {};

  for (const lib of materialLibs) {
    const moduleName = `@material/${lib}`;
    aliases[moduleName] = path.resolve(`./node_modules/${moduleName}`);
  }

  return aliases;
}

module.exports = {
  output: {
    filename: 'main.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },

  resolve: {
    alias: {
      ...materialAliases(
        'mwc-ripple',
        'mwc-notched-outline',
        'mwc-icon',
        'mwc-button',
        'mwc-select',
        'mwc-switch',
        'mwc-list',
        'mwc-tab',
        'mwc-tab-bar',
        'mwc-circular-progress',
        'mwc-checkbox',
        'mwc-formfield',
        'mwc-textfield',
        'mwc-textarea',
      ),
      'lit-element': path.resolve('node_modules/lit-element'),
      'lit-html': path.resolve('./node_modules/lit-html'),
      'wicg-inert': path.resolve('./node_modules/wicg-inert/dist/inert'),
    },
    extensions: ['.ts', '.tsx', '.js', '.json', '.css', '.scss', '.html'],
  },
  entry: ['babel-polyfill', './src/playground-app.js'],
  devServer: {
    historyApiFallback: true,
    port: 8000,
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
            plugins: ['@babel/plugin-syntax-dynamic-import'],
          },
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: [{ from: '../assets', to: 'assets' }] }),
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new BaseHrefWebpackPlugin({
      baseHref:
        !process.env.NODE_ENV || process.env.NODE_ENV == 'development'
          ? '/'
          : '/holochain-playground',
    }),
  ],
};
