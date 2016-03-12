# purs-loader

> [PureScript](http://www.purescript.org) loader for [webpack](http://webpack.github.io)

## Install

Install with [npm](https://npmjs.org/package/purs-loader).

This loader works in conjunction with the [PureScript webpack plugin](https://npmjs.org/package/purescript-webpack-plugin). Ensure the plugin is installed and configured accordingly.

```
npm install purs-loader --save-dev
```

## Example

```js
// webpack.config.js
'use strict';

var PurescriptWebpackPlugin = require('purescript-webpack-plugin');

var src = ['bower_components/purescript-*/src/**/*.purs', 'src/**/*.purs'];

var ffi = ['bower_components/purescript-*/src/**/*.js', 'src/**/*FFI.js'];

var modulesDirectories = [
  'node_modules',
  'bower_components'
];

var config
  = { entry: './src/entry'
    , output: { path: __dirname
              , pathinfo: true
              , filename: 'bundle.js'
              }
    , module: { loaders: [ { test: /\.purs$/
                           , loader: 'purs-loader'
                           } ] }
    , resolve: { modulesDirectories: modulesDirectories }
    , plugins: [ new PurescriptWebpackPlugin({src: src, ffi: ffi}) ]
    }
    ;

module.exports = config;
```

See the [example](https://github.com/ethul/purs-loader/tree/master/example) directory for a complete example.
