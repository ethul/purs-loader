'use strict'

const debug = require('debug')('purs-loader')
const loaderUtils = require('loader-utils')
const Promise = require('bluebird')
const path = require('path')
const PsModuleMap = require('./PsModuleMap');
const Psc = require('./Psc');
const PscIde = require('./PscIde');
const toJavaScript = require('./to-javascript');
const dargs = require('./dargs');
const spawn = require('cross-spawn').sync
const eol = require('os').EOL

module.exports = function purescriptLoader(source, map) {
  const callback = this.async()
  const config = this.options
  const query = loaderUtils.parseQuery(this.query)
  const webpackOptions = this.options.purescriptLoader || {}

  const depsPaths = (pscPackage => {
    if (pscPackage) {
      debug('calling psc-package...')

      return spawn('psc-package', ['sources']).stdout.toString().split(eol).filter(v => v != '')
    }
    else {
      return [ path.join('bower_components', 'purescript-*', 'src', '**', '*.purs') ]
    }
  })

  let options = Object.assign(webpackOptions, query)

  const defaultDeps = depsPaths(options.pscPackage)
  const defaultOptions = {
    context: config.context,
    psc: 'psc',
    pscArgs: {},
    pscBundle: 'psc-bundle',
    pscBundleArgs: {},
    pscIde: false,
    pscIdeColors: options.psc === 'psa',
    pscIdeArgs: {},
    pscPackage: false,
    bundleOutput: 'output/bundle.js',
    bundleNamespace: 'PS',
    bundle: false,
    warnings: true,
    output: 'output',
    src: [
      path.join('src', '**', '*.purs'),
      ...defaultDeps
    ]
  }

  this.cacheable && this.cacheable()

  let cache = config.purescriptLoaderCache = config.purescriptLoaderCache || {
    rebuild: false,
    deferred: [],
    bundleModules: [],
    warnings: [],
    errors: []
  }

  if (options.pscPackage && options.src) {
    options.src = options.src.concat(defaultDeps) // append psc-package-provided source paths with users'
  }

  options = Object.assign(defaultOptions, options)

  if (!config.purescriptLoaderInstalled) {
    config.purescriptLoaderInstalled = true

    // invalidate loader cache when bundle is marked as invalid (in watch mode)
    this._compiler.plugin('invalid', () => {
      debug('invalidating loader cache');

      cache = config.purescriptLoaderCache = {
        rebuild: options.pscIde,
        deferred: [],
        bundleModules: [],
        ideServer: cache.ideServer,
        psModuleMap: cache.psModuleMap,
        warnings: [],
        errors: []
      }
    });

    // add psc warnings to webpack compilation warnings
    this._compiler.plugin('after-compile', (compilation, callback) => {
      cache.warnings.forEach(warning => {
        compilation.warnings.push(warning);
      });

      cache.errors.forEach(error => {
        compilation.errors.push(error);
      });

      callback()
    });
  }

  const psModuleName = PsModuleMap.match(source)
  const psModule = {
    name: psModuleName,
    load: js => callback(null, js),
    reject: error => callback(error),
    srcPath: this.resourcePath,
    srcDir: path.dirname(this.resourcePath),
    jsPath: path.resolve(path.join(options.output, psModuleName, 'index.js')),
    options: options,
    cache: cache,
    emitWarning: warning => {
      if (options.warnings && warning.length) {
        cache.warnings.push(warning);
      }
    },
    emitError: error => {
      if (error.length) {
        cache.errors.push(error);
      }
    }
  }

  debug('loader called', psModule.name)

  if (options.bundle) {
    cache.bundleModules.push(psModule.name)
  }

  if (cache.rebuild) {
    return PscIde.connect(psModule)
      .then(PscIde.rebuild)
      .then(toJavaScript)
      .then(psModule.load)
      .catch(psModule.reject)
  }

  if (cache.compilationFinished) {
    return toJavaScript(psModule).then(psModule.load).catch(psModule.reject)
  }

  // We need to wait for compilation to finish before the loaders run so that
  // references to compiled output are valid.
  cache.deferred.push(psModule)

  if (!cache.compilationStarted) {
    return Psc.compile(psModule)
       .then(() => PsModuleMap.makeMap(options.src).then(map => {
         debug('rebuilt module map');
         cache.psModuleMap = map;
       }))
      .then(() => Promise.map(cache.deferred, psModule => {
        if (typeof cache.ideServer === 'object') cache.ideServer.kill()
        return toJavaScript(psModule).then(psModule.load)
      }))
      .catch(error => {
        cache.deferred[0].reject(error)
        cache.deferred.slice(1).forEach(psModule => psModule.reject(new Error('purs-loader failed')))
      })
  }
}
