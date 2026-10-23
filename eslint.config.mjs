import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // three.js scene code is imperative by design: cameras, controls, materials and the renderer are
    // mutated from effects and frame callbacks. The React Compiler is not enabled for this project, so
    // its immutability analysis is advisory; keep it on everywhere except the scene layer.
    files: ["src/components/viewer/**", "src/components/models/**"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".tmp/**",
  ]),
]);

export default eslintConfig;
