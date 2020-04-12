import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

const pkg = require("./package.json");

const libraryName = "index";

export default {
  input: `src/${libraryName}.ts`,
  output: { dir: 'dist', format: "es", sourcemap: true },
  external: [...Object.keys(pkg.dependencies), /@material/, /rxjs/],
  plugins: [
    json(),
    typescript({
      objectHashIgnoreUnknownHack: true,
      abortOnError: false,

      useTsconfigDeclarationDir: true,
      cacheRoot: `${require("temp-dir")}/.rpt2_cache`,
    }),
    resolve(),
    commonjs({
      namedExports: {},
    }),
    sourceMaps(),
  ]
};
