const path = require('path');

module.exports = {
  entry: {
    app: './js/app.js',
    // Admin-siden har egen bundle: den skal ikke lastes av de vanlige sidene.
    admin: './js/admin.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: 'js/[name].[contenthash].js',
  },
};