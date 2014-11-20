# purs-loader

> [PureScript](http://www.purescript.org) loader for [webpack](http://webpack.github.io)

## Install

Install with [npm](https://npmjs.org/package/purs-loader)

```
npm install purs-loader --save-dev
```

## Options

 - **no-prelude**: Boolean value that toggles `--no-prelude`
  - Do not include the Prelude in the generated Javascript.
 - **no-opts**: Boolean value that toggles `--no-opts`
  - Disable all optimizations.
 - **no-magic-do**: Boolean value that toggles `--no-magic-do`
  - Turn off optimizations which inline calls to >>= for the Eff monad.
 - **no-tco**: Boolean value that toggles `--no-tco`
  - Turn off tail-call elimination.
 - **verbose-errors**: Boolean value that toggles `--verbose-errors`
  - Generate verbose error messages.
 - **output**: String value that sets `--output=<string>`
  - Write the generated Javascript to the specified file.

## Example

```js
var path = require('path');

module.exports = {
  entry: './src/test',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },
  module: {
    loaders: [{
      test: /\.purs$/,
      loader: 'purs-loader?no-prelude&output=output'
    }]
  },
  resolve: {
    modulesDirectories: [
      'node_modules',
      'web_modules',
      'output'
    ]
  }
};
```
