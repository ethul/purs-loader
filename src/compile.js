"use strict"

const Promise = require("bluebird")

const spawn = require("cross-spawn")

const debug_ = require("debug")

const debug = debug_("purs-loader")

const debugVerbose = debug_("purs-loader:verbose")

const dargs = require("./dargs")

module.exports = function compile (psModule) {
  const options = psModule.options

  const compileCommand = options.psc || "purs"

  const compileArgs = (options.psc ? [] : [ "compile" ]).concat(dargs(Object.assign({
    _: options.src,
    output: options.output,
  }, options.pscArgs)))

  const stderr = []

  debug("compile %s %O", compileCommand, compileArgs)

  return new Promise((resolve, reject) => {
    debug("compiling PureScript...")

    const compilation = spawn(compileCommand, compileArgs)

    compilation.stderr.on("data", data => {
      stderr.push(data.toString())
    })

    compilation.stdout.on("data", data => {
      debugVerbose(data.toString())
    })

    compilation.on("close", code => {
      debug("finished compiling PureScript.")

      if (code !== 0) {
        const errorMessage = stderr.join("")
        if (errorMessage.length) {
          psModule.emitError(errorMessage)
        }
        if (options.watch) {
          resolve(psModule)
        } else {
          reject(new Error("compilation failed"))
        }
      } else {
        const warningMessage = stderr.join("")
        if (options.warnings && warningMessage.length) {
          psModule.emitWarning(warningMessage)
        }
        resolve(psModule)
      }
    })
  })
}
