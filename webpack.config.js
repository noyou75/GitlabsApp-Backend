const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: ['webpack/hot/poll?1000', './src/main.ts'],
  watch: false,
  target: 'node',
  externals: [
    nodeExternals({
      whitelist: ['webpack/hot/poll?1000'],
    }),
  ],
  module: {
    rules: [
      {
        test: /ormconfig\.js$/,
        type: 'javascript/auto',
        use: [path.resolve('ormconfig.loader.js')],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  optimization: {
    noEmitOnErrors: true,
  },
  stats: {
    colors: true,
    modules: false,
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'webpack-server.js',
  },
};
