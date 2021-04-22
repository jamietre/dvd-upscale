module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { project: "./tsconfig.json" },
  env: { es6: true },
  ignorePatterns: ["node_modules", "build", "coverage"],
  plugins: ["import", "eslint-comments"],
  extends: [
    "eslint:recommended",
    "plugin:eslint-comments/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
    "prettier",
    "prettier/@typescript-eslint",
  ],
  globals: { BigInt: true, console: true, WebAssembly: true },
  rules: {
    "@typescript-eslint/no-misused-promises": 2,
    "@typescript-eslint/no-floating-promises": 2,
    "@typescript-eslint/promise-function-async": 2,
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "(^_|^T|^U)",
        varsIgnorePattern: "(^_|^T|^U)",
        ignoreRestSiblings: true,
      },
    ],
    "eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
    "eslint-comments/no-unused-disable": "error",
  },
};
