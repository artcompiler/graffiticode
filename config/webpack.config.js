const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = () => {
  return {
    entry: {
      views: './src/views.js',
      form: './src/form.js',
    },
    output: {
      filename: 'bundle.js',
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, './../dist'),
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /\.html$/,
          use: ['html-loader']
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ]
    },
    plugins: [
      new CleanWebpackPlugin({ cleanStaleWebpackAssets: true }),
      new CopyPlugin({
        patterns: [{ from: 'public' }]
      }),
      new GenerateSW({
        swDest: 'sw.js',
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [{
          urlPattern: new RegExp('/(item|code|data)'),
          handler: 'StaleWhileRevalidate'
        }]
      }),
    ],
  };
};
