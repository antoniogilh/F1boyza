const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      template: 'kalender.html',
      filename: 'kalender.html',
    }),
    new HtmlWebpackPlugin({
      template: 'resultater.html',
      filename: 'resultater.html',
    }),
    new HtmlWebpackPlugin({
      template: 'straff.html',
      filename: 'straff.html',
    }),
    new HtmlWebpackPlugin({
      template: 'Spinthatshit.html',
      filename: 'Spinthatshit.html',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'img', to: 'img' },
        { from: 'data', to: 'data' },
        { from: 'icon.svg', to: 'icon.svg' },
        { from: 'favicon.ico', to: 'favicon.ico' },
        { from: 'robots.txt', to: 'robots.txt' },
        { from: 'icon.png', to: 'icon.png' },
        { from: '404.html', to: '404.html' },
        { from: 'site.webmanifest', to: 'site.webmanifest' },
        { from: 'fanelogo.png', to: 'fanelogo.png' },
        { from: 'sidelogo.png', to: 'sidelogo.png' },
      ],
    }),
  ],
});