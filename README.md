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

See the [example](https://github.com/ethul/purs-loader/tree/topic/bower-components/example) directory for a complete example.
