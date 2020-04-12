import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";

const pkg = require("./package.json");

const libraryName = "index";

export default {
  input: `src/${libraryName}.ts`,
  output: { file: pkg.module, format: "es", sourcemap: true },
  watch: {
    include: "src/**",
  },
  external: [...Object.keys(pkg.dependencies)],
  plugins: [
    json(),
    typescript({
      objectHashIgnoreUnknownHack: true,
      abortOnError: false,

      useTsconfigDeclarationDir: true,
      cacheRoot: `${require("temp-dir")}/.rpt2_cache`,
    }),
    sourceMaps(),
  ],
  preserveSymlinks: true,
};
