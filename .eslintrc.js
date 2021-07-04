module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "standard",
    // "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended",
    "prettier",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 11,
    project: ["./tsconfig.json"],
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "simple-import-sort"],
  root: true,
  rules: {
    "prettier/prettier": "warn",
    "@typescript-eslint/require-await": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "prefer-template": "warn",
    curly: "error",
    "@typescript-eslint/no-misused-promises": "off",
    "no-async-promise-executor": "off",
    "@typescript-eslint/no-namespace": "off",
    // Turn off default import rules
    "sort-imports": "off",
    "import/order": "off",
    // Use simple-import-sort instead
    "simple-import-sort/imports": "error",
    "@typescript-eslint/unbound-method": [
      "error",
      {
        ignoreStatic: true,
      },
    ],
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowNumber: true,
        allowBoolean: true,
        allowNullish: true,
      },
    ],
  },
};
