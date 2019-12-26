module.exports = {
  root: true,
  env: {
    node: true
  },
  "rules": {
    "no-console": "off",
  },
  extends: ["plugin:vue/essential", "@vue/prettier", "@vue/typescript"],
  parserOptions: {
    parser: "@typescript-eslint/parser"
  }
};
