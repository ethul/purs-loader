# purs-loader

> [PureScript](http://www.purescript.org) loader for [webpack](http://webpack.github.io)

## Install

Install with [npm](https://npmjs.org/package/purs-loader)

```
npm install purs-loader --save-dev
```

## Options

###### `noPrelude` (Boolean)

Toggles `--no-prelude` that omits the Prelude.

###### `noTco` (Boolean)

Toggles `--no-tco` that disables tail-call optimizations.

###### `noMagicDo` (Boolean)

Toggles `--no-magic-do` that disables optimizations overloading the do keyword generating efficient code for the `Eff` monad.

###### `noOpts` (Boolean)

Toggles `--no-opts` that skips the optimization phase.

###### `verboseErrors` (Boolean)

Toggles `--verbose-errors` that displays verbose error messages.

###### `comments` (Boolean)

Toggles `--comments` that includes comments in generated code.

###### `output` (String)

Sets `--output=<string>` the specifies the output directory, `output` by default.

###### `noPrefix` (Boolean)

Toggles `--no-prefix` that does not include the comment header.

###### `requirePath` (String)

Sets `--require-path=<string>` that specifies the path prefix to use for `require()` calls in the generated JavaScript.

###### `ffi` (String Array)

Specifies the PureScript FFI files setting `--ffi=<string>`. Glob syntax is supported. This option is specified as `ffi[]=path`.

###### `src` (String Array)

Specifies the PureScript source files. Glob syntax is supported. This option is specified as `src[]=path`.

## Example

```js
// webpack.config.js

var path = require('path');

var srcs = ['src[]=bower_components/purescript-*/src/**/*.purs', 'src[]=src/**/*.purs'];

var ffis = ['ffi[]=bower_components/purescript-*/src/**/*.js'];

var output = 'output';

var modulesDirectories = [
  'node_modules',
  // The bower component for purescript-prelude is specified here to
  // allow JavaScript files to require the 'Prelude' module globally.
  'bower_components/purescript-prelude/src',
  // The output directory is specified here to allow PureScript files in
  // your source to import other PureScript modules in your source.
  output
];

var config
  = { entry: './src/entry'
    , output: { path: __dirname
              , pathinfo: true
              , filename: 'bundle.js'
              }
    , module: { loaders: [ { test: /\.purs$/
                           , loader: 'purs-loader?output=' + output + '&' + srcs.concat(ffis).join('&')
                           } ] }
    , resolve: { modulesDirectories: modulesDirectories
               , extensions: ['', '.js', '.purs']
               }
    , resolveLoader: { root: path.join(__dirname, 'node_modules') }
    }
    ;

module.exports = config;
```

See the [example](https://github.com/ethul/purs-loader/tree/master/example) directory for a complete example.
