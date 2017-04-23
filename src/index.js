'use strict'

const debug_ = require('debug');

const debug = debug_('purs-loader');

const debugVerbose = debug_('purs-loader:verbose');

const loaderUtils = require('loader-utils')

const Promise = require('bluebird')

const path = require('path')

const PsModuleMap = require('./purs-module-map');

const compile = require('./compile');

const bundle = require('./bundle');

const ide = require('./ide');

const toJavaScript = require('./to-javascript');

const dargs = require('./dargs');

const spawn = require('cross-spawn').sync

const eol = require('os').EOL

module.exports = function purescriptLoader(source, map) {
  this.cacheable && this.cacheable();

  const callback = this.async();

  const webpackConfig = this.options;

  const loaderOptions = loaderUtils.getOptions(this) || {};

  const srcOption = (pscPackage => {
    if (pscPackage) {
      const pscPackageCommand = 'psc-package';

      const pscPackageArgs = ['sources'];

      debug('psc-package %s %o', pscPackageCommand, pscPackageArgs);

      return spawn(pscPackageCommand, pscPackageArgs).stdout.toString().split(eol).filter(v => v != '').concat(
        loaderOptions.src || [
          path.join('src', '**', '*.purs'),
        ]
      )
    }
    else {
      return loaderOptions.src || [
        path.join('bower_components', 'purescript-*', 'src', '**', '*.purs'),
        path.join('src', '**', '*.purs'),
      ];
    }
  })(loaderOptions.pscPackage);

  const options = Object.assign({
    context: webpackConfig.context,
    psc: null,
    pscArgs: {},
    pscBundle: null,
    pscBundleArgs: {},
    pscIde: false,
    pscIdeColors: loaderOptions.psc === 'psa',
    pscIdeArgs: {},
    pscPackage: false,
    bundleOutput: 'output/bundle.js',
    bundleNamespace: 'PS',
    bundle: false,
    warnings: true,
    watch: false,
    output: 'output',
    src: []
  }, loaderOptions, {
    src: srcOption
  });

  var cache = webpackConfig.purescriptLoaderCache = webpackConfig.purescriptLoaderCache || {
    rebuild: false,
    deferred: [],
    bundleModules: [],
    warnings: [],
    errors: []
  };

  if (!webpackConfig.purescriptLoaderInstalled) {
    debugVerbose('installing purs-loader with options: %O', options);

    webpackConfig.purescriptLoaderInstalled = true

    // invalidate loader cache when bundle is marked as invalid (in watch mode)
    this._compiler.plugin('invalid', () => {
      debugVerbose('invalidating loader cache');

      cache = webpackConfig.purescriptLoaderCache = {
        rebuild: options.pscIde,
        deferred: [],
        bundleModules: [],
        ideServer: cache.ideServer,
        psModuleMap: cache.psModuleMap,
        warnings: [],
        errors: []
      };
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

  const psModuleName = PsModuleMap.matchModule(source);

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

  debug('loading %s', psModule.name);

  if (options.bundle) {
    cache.bundleModules.push(psModule.name);
  }

  if (cache.rebuild) {
    const connect = () => {
      if (!cache.ideServer) {
        cache.ideServer = true;

        return ide.connect(psModule)
          .then(ideServer => {
            cache.ideServer = ideServer;
            return psModule;
          })
          .then(ide.loadWithRetry)
          .catch(error => {
            if (cache.ideServer.kill) {
              debug('ide failed to initially load modules, stopping the ide server process');

              cache.ideServer.kill();
            }

            cache.ideServer = null;

            return Promise.reject(error);
          })
        ;
      }
      else {
        return Promise.resolve(psModule);
      }
    };

    const rebuild = () =>
      ide.rebuild(psModule).catch(error => {
        if (error instanceof ide.UnknownModuleError) {
          if (!cache.compilationStarted) {
            cache.compilationStarted = true;

            return compile(psModule)
              .then(() => {
                cache.compilationFinished = true;
              })
              .then(() =>
                PsModuleMap.makeMap(options.src).then(map => {
                  debug('rebuilt module map after unknown module forced a recompilation');

                  cache.psModuleMap = map;
                })
              )
              .then(() => ide.load(psModule))
              .then(() => psModule)
            ;
          }
          else {
            return Promise.resolve(psModule);
          }
        }
        else {
          debug('ide rebuild failed due to an unhandled error: %o', error);

          return Promise.reject(error);
        }
      })
    ;

    connect()
      .then(rebuild)
      .then(toJavaScript)
      .then(psModule.load)
      .catch(psModule.reject)
    ;
  }
  else if (cache.compilationFinished) {
    debugVerbose('compilation is already finished, loading module %s', psModule.name);

    toJavaScript(psModule)
      .then(psModule.load)
      .catch(psModule.reject);
  }
  else {
    // The compilation has not finished yet. We need to wait for
    // compilation to finish before the loaders run so that references
    // to compiled output are valid. Push the modules into the cache to
    // be loaded once the complation is complete.

    cache.deferred.push(psModule);

    if (!cache.compilationStarted) {
      cache.compilationStarted = true;

      compile(psModule)
        .then(() => {
          cache.compilationFinished = true;
        })
        .then(() => {
          if (options.bundle) {
            return bundle(options, cache.bundleModules);
          }
        })
        .then(() =>
          PsModuleMap.makeMap(options.src).then(map => {
            debug('rebuilt module map after compilation');

            cache.psModuleMap = map;
          })
        )
        .then(() =>
          Promise.map(cache.deferred, psModule =>
            toJavaScript(psModule).then(psModule.load)
          )
        )
        .catch(error => {
          cache.deferred[0].reject(error);

          cache.deferred.slice(1).forEach(psModule => {
            psModule.reject(new Error('purs-loader failed'));
          })
        })
      ;
    }
    else {
      // The complation has started. Nothing to do but wait until it is
      // done before loading all of the modules.
    }
  }
}
