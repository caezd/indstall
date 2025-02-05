import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";

export default {
    input: "src/index.js",
    output: {
        file: "dist/indstall.js",
        format: "iife",
        name: "Indstall",
    },
    plugins: [json(), terser(), resolve(), commonjs()],
};
