import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import multiInput from 'rollup-plugin-multi-input';
import commonjs from '@rollup/plugin-commonjs';

const pkg = require('./package.json');

export default {
  input: `src/**/*.ts`,
  output: { dir: 'dist', format: 'es', sourcemap: true },
  external: [...Object.keys(pkg.dependencies), /@material/, /rxjs/],
  plugins: [
    multiInput(),
    json(),
    typescript(),
    resolve({
      preferBuiltins: true,
      browser: true,
      mainFields: ['browser', 'module', 'main'],
    }),
    commonjs({}),
    sourceMaps(),
  ],
};
