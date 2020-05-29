"use strict"

const Promise = require("bluebird")

const fs = require("fs")

const path = require("path")

const debug_ = require("debug")

const debugVerbose = debug_("purs-loader:verbose")

module.exports = function sourceMap (psModule, js) {
  const options = psModule.options

  const jsPath = psModule.jsPath

  const srcPath = psModule.srcPath

  const source = psModule.source

  const remainingRequest = psModule.remainingRequest

  const sourceMapPath = path.join(path.dirname(jsPath), "index.js.map")

  const isSourceMapsEnabled = options.pscArgs && options.pscArgs.sourceMaps

  return new Promise((resolve, reject) => {
    if (!isSourceMapsEnabled) {
      resolve({
        js: js,
        map: undefined,
      })
    } else {
      debugVerbose("loading source map %s", sourceMapPath)

      fs.readFile(sourceMapPath, "utf-8", (error, result) => {
        if (error) {
          reject(error)
        } else {
          try {
            const map = Object.assign(JSON.parse(result), {
              sources: [
                remainingRequest,
              ],
              file: path.normalize(srcPath),
              sourcesContent: [
                source,
              ],
            })

            const jsRemovedMapUrl = js.replace(/^\/\/# sourceMappingURL=[^\r\n]*/gm, "")

            resolve({
              js: jsRemovedMapUrl,
              map: map,
            })
          } catch (error) {
            reject(error)
          }
        }
      })
    }
  })
}
