const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

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
          use: {
            loader: "babel-loader"
          }
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: "html-loader"
            }
          ]
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
    ],
  };
};