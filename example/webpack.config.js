var path = require('path');

module.exports = {
  entry: './src/entry',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },
  resolve: {
    modulesDirectories: [
      'node_modules',
      'web_modules',
      'output'
    ]
  }
};
