const path = require("path");

const config = {
  publicPath: "./",
  pages: {
    main: "./src/main.ts",
    demo: "./src/demo/main.ts",
  },

  chainWebpack: config => {
    // ESLint autofix
    config.module
      .rule("eslint")
      .use("eslint-loader")
      .options({
        fix: true
      });

    config.resolve.alias
      .set("@graph", path.resolve(__dirname, "src"))
  },

  devServer: {
    host: "0.0.0.0",
    port: 7000
  }
};

module.exports = config;
