const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/index.ts", // Change to your entry point
  target: "node", // Specify Node.js environment
  externals: [nodeExternals()], // Exclude node_modules from the bundle
  module: {
    rules: [
      {
        test: /\.ts$/, // Use ts-loader for .ts files
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"], // Resolve .ts and .js files
  },
  output: {
    filename: "bundle.js", // Output file name
    path: path.resolve(__dirname, "dist"), // Output directory
  },
};
