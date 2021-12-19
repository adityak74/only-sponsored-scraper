const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (_, opts) => ({
  entry: './src/index.js',
  mode: opts.mode || 'production',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'scraper.js',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        },
      },
    ],
  },
  externals: [nodeExternals()],
});
