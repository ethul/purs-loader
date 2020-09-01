"use strict"

const path = require("path")

const Promise = require("bluebird")

const fs = Promise.promisifyAll(require("fs"))

const globby = require("globby")

const debug = require("debug")("purs-loader")

const srcModuleRegex = /(?:^|\n)module\s+([\w.]+)/i

const importModuleRegex = /(?:^|\n)\s*import\s+([\w.]+)/ig

module.exports.matchModule = function matchModule(str) {
  const matches = str.match(srcModuleRegex)
  return matches && matches[1]
}

module.exports.matchImports = function matchImports(str) {
  const matches = str.match(importModuleRegex)
  return (matches || []).map(a => a.replace(/\n?\s*import\s+/i, ""))
}

module.exports.makeMapEntry = function makeMapEntry(filePurs) {
  const dirname = path.dirname(filePurs)

  const basename = path.basename(filePurs, ".purs")

  const fileJs = path.join(dirname, `${basename}.js`)

  const result = Promise.props({
    filePurs: fs.readFileAsync(filePurs, "utf8"),
    fileJs: fs.readFileAsync(fileJs, "utf8").catch(() => undefined),
  }).then(fileMap => {
    const sourcePurs = fileMap.filePurs

    const sourceJs = fileMap.fileJs

    const moduleName = module.exports.matchModule(sourcePurs)

    const imports = module.exports.matchImports(sourcePurs)

    const map = {}

    map[moduleName] = map[moduleName] || {}

    map[moduleName].src = path.resolve(filePurs)

    map[moduleName].imports = imports

    if (sourceJs) {
      map[moduleName].ffi = path.resolve(fileJs)
    }

    return map
  })

  return result
}

module.exports.makeMap = function makeMap(src) {
  debug("loading PureScript source and FFI files from %o", src)

  const globs = [].concat(src)

  return globby(globs).then(paths =>
    Promise.all(paths.map(module.exports.makeMapEntry)).then(result =>
      result.reduce(Object.assign, {}),
    ),
  )
}
