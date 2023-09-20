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
        spago: true,
        pscIde: true,
        src: ['src/**/*.purs']
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
  psc: null, // purs compile
  pscArgs: {},
  pscBundle: null, // purs bundle
  pscBundleArgs: {},
  pscIde: false, // instant rebuilds using psc-ide-server (experimental)
  pscIdeClient: null, // purs ide client
  pscIdeClientArgs: {}, // for example, to use different port {port: 4088}
  pscIdeServer: null, // purs ide server
  pscIdeServerArgs: {}, // for example, to change the port {port: 4088}
  pscIdeRebuildArgs: {}, // for example, for sourcemaps {codegen: ['js', 'sourcemaps']}
  pscIdeColors: false, // defaults to true if psc === 'psa'
  pscPackage: false, // include dependencies from psc-package
  spago: false, // include dependencies from spago
  spagoDhall: null, // if set, uses the specified spago config (i.e., spago -x spagoDhall ...)
  bundleOutput: 'output/bundle.js',
  bundleNamespace: 'PS',
  bundle: false,
  warnings: true,
  watch: false, // indicates if webpack is in watch mode
  output: 'output',
  src: [
    path.join('src', '**', '*.purs'),
    // if pscPackage = true
    // source paths reported by `psc-package sources`
    // if spago = true
    // source paths reported by `spago sources`
    // if pscPackage = false and spago = false
    path.join('bower_components', 'purescript-*', 'src', '**', '*.purs')
  ]
}
```

### `psc-ide` support (experimental)

Experimental support for instant rebuilds using `psc-ide-server` can be enabled
via the `pscIde: true` option.
You can use an already running `psc-ide-server` instance by specifying the port in `pscIdeArgs`,
if there is no server running this loader will start one for you.

### `psc-package` support (experimental)

Set `pscPackage` query parameter to `true` to enable `psc-package` support. The `psc-package`-supplied source paths
will be appended to `src` parameter.

### `spago` support (experimental)

Set `spago` query parameter to `true` to enable `spago` support. The `spago`-supplied source paths
will be appended to `src` parameter.

### Troubleshooting

#### Slower webpack startup after enabling psc-ide support?

By default, the psc-ide-server will be passed the globs from query.src, this is
helpful for other tools using psc-ide-server (for example IDE plugins), however
it might result in a slower initial webpack startup time (rebuilds are not
affected). To override the default behaviour, add:
`pscIdeServerArgs: { "_": ['your/*globs/here'] }` to the loader config

#### Errors not being displayed in watch mode?

When the `watch` option is set to `true`, psc errors are appended to
webpack's compilation instance errors array and not passed back as an
error to the loader's callback. This may result in the error not being
reported by webpack. To display errors, the following plugin may be added
to the webpack config.

```javascript
const webpackConfig = {
  // ...
  plugins: [
    function(){
      this.plugin('done', function(stats){
        process.stderr.write(stats.toString('errors-only'));
      });
    }
  ]
  // ...
}
```

#### Error `spawn ENOENT`

This is caused when the loader tries to spawn a binary that does not exists
(`file or directory not found`). If you call webpack like `webpack` or
`webpack --watch`, then ensure that all required binaries that the
loader depends on are available in your `$PATH`. 

If you run webpack through an npm script (e.g., npm run or npm start) on NixOS, 
then it will first attempt to find binaries in `node_packages/.bin`. 
If you have the compiler installed through `npm` and it finds it there, this will 
cause `ENOENT`on Nix, because [the binary needs to be patched first, but npm will 
install the binary that is linked with /lib64/ld-linux-x86-64.so.2 - a file that 
will not exist at that path in NixOS](https://github.com/ethul/purescript-webpack-example/issues/5#issuecomment-282492131).
The solution is to simply use the compiler from `haskellPackages.purescript` and
make sure that it's available in `$PATH`. For more information about how to make 
it work on Nix, see [Purescript Webpack Example](https://github.com/ethul/purescript-webpack-example#using-globally-installed-binaries)
