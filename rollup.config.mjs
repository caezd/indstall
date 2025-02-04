import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
    input: "src/index.js", // Fichier source principal
    output: {
        file: "dist/indstall.js", // Fichier final
        format: "iife", // Format adapté aux navigateurs
        name: "Indstall",
    },
    plugins: [resolve(), commonjs(), terser()],
};
