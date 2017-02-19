# purs-loader

> [PureScript](http://www.purescript.org) loader for [webpack](http://webpack.github.io)

- Supports hot-reloading and rebuilding of single source files
- Dead code elimination using the `bundle` option
- Colorized build output using `purescript-psa` and the `psc: "psa"` option

## Install

Install with [npm](https://npmjs.org/package/purs-loader).

```
// For PureScript 0.9 and newer
npm install purs-loader --save-dev

// For PureScript 0.8
npm install purs-loader@purescript-0.8 --save-dev
```

## Example

```javascript
const webpackConfig = {
  // ...
  loaders: [
    // ...
    {
      test: /\.purs$/,
      loader: 'purs-loader',
      exclude: /node_modules/,
      query: {
        psc: 'psa',
        src: ['bower_components/purescript-*/src/**/*.purs', 'src/**/*.purs']
      }
    }
    // ...
  ]
  // ...
}
```

Refer to the [purescript-webpack-example](https://github.com/ethul/purescript-webpack-example) for a more detailed example.

### Options

Default options:

```javascript
const loaderConfig = {
  psc: 'psc',
  pscArgs: {},
  pscBundle: 'psc-bundle',
  pscBundleArgs: {},
  pscIde: false, // instant rebuilds using psc-ide-server (experimental)
  pscIdeArgs: {}, // for example, to use different psc-ide-server port: {port: 4088}
  pscIdeServerArgs: {}, // for example, to change the port { port: 4088 }
  pscIdeColors: false, // defaults to true if psc === 'psa'
  pscPackage: false,
  bundleOutput: 'output/bundle.js',
  bundleNamespace: 'PS',
  bundle: false,
  warnings: true,
  watch: false, // indicates if webpack is in watch mode
  output: 'output',
  src: [
    path.join('src', '**', '*.purs'),
    // if pscPackage = false
    path.join('bower_components', 'purescript-*', 'src', '**', '*.purs')
    // if pscPackage = true
    // source paths reported by `psc-package sources`
  ]
}
```

### `psc-ide` support (experimental)

Experimental support for instant rebuilds using `psc-ide-server` can be enabled
via the `pscIde: true` option.
You can use an already running `psc-ide-server` instance by specifying the port in `pscIdeArgs`,
if there is no server running this loader will start one for you.


#### Slower webpack startup after using purs-loader ?

By default, the psc-ide-server will be passed the globs from query.src, this is
helpful for other tools using psc-ide-server (for example IDE plugins), however
it might result in a slower initial webpack startup time (rebuilds are not
affected). To override the default behaviour, add:
`pscIdeServerArgs: { "_": ['your/*globs/here'] }` to the loader config

### `psc-package` support (experimental)

Set `pscPackage` query parameter to `true` to enable `psc-package` support. The `psc-package`-supplied source paths 
will be appended to `src` parameter.
