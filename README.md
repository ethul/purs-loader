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

###### `src` (String Array)

Specifies PureScript source paths to be globbed for `.purs` files. By default, `bower_components` is search. Additional paths may be specified using this option. This option is specified as `src[]=path`.

## Example

See the [example](https://github.com/ethul/purs-loader/tree/master/example) directory for a complete example.
