# purs-loader

> [PureScript](http://www.purescript.org) loader for [webpack](http://webpack.github.io)

- Supports hot-reloading and rebuilding of single source files
- Dead code elimination using the `bundle` option
- Colorized build output using `purescript-psa` and the `psc: "psa"` option

## Install

Install with [npm](https://npmjs.org/package/purs-loader).

```
npm install purs-loader --save-dev
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
        src: ['bower_components/purescript-*/src/**/*.purs', 'src/**/*.purs'],
        ffi: ['bower_components/purescript-*/src/**/*.js', 'src/**/*.js'],
      }
    }
    // ...
  ]
  // ...
}
```

### Options

Default options:

```javascript
{
  psc: 'psc',
  pscArgs: {},
  pscBundle: 'psc-bundle',
  pscBundleArgs: {},
  pscIde: false, // instant rebuilds using psc-ide-server (experimental)
  pscIdeColors: false, // defaults to true if psc === 'psa'
  bundleOutput: 'output/bundle.js',
  bundleNamespace: 'PS',
  bundle: false,
  warnings: true,
  output: 'output',
  src: [
    path.join('src', '**', '*.purs'),
    path.join('bower_components', 'purescript-*', 'src', '**', '*.purs')
  ],
  ffi: [
    path.join('src', '**', '*.js'),
    path.join('bower_components', 'purescript-*', 'src', '**', '*.js')
  ],
}
```

### Instant rebuilds (experimental)

Experimental support for instant rebuilds using `psc-ide-server` can be enabled
via the `pscIde: true` option.
