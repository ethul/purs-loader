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

const sourceMaps = require('./source-maps');

const dargs = require('./dargs');

const spawn = require('cross-spawn').sync

const eol = require('os').EOL

module.exports = function purescriptLoader(source, map) {
  this.cacheable && this.cacheable();

  const webpackConfig = this.options;

  var cache = webpackConfig.purescriptLoaderCache = webpackConfig.purescriptLoaderCache || {
    rebuild: false,
    deferred: [],
    bundleModules: [],
    ideServer: null,
    psModuleMap: null,
    warnings: [],
    errors: [],
    compilationStarted: false,
    compilationFinished: false,
    installed: false,
    srcOption: []
  };

  const callback = this.async();

  const loaderOptions = loaderUtils.getOptions(this) || {};

  const srcOption = (pscPackage => {
    const srcPath = path.join('src', '**', '*.purs');

    const bowerPath = path.join('bower_components', 'purescript-*', 'src', '**', '*.purs');

    if (cache.srcOption.length > 0) {
      return cache.srcOption;
    }
    else if (pscPackage) {
      const pscPackageCommand = 'psc-package';

      const pscPackageArgs = ['sources'];

      const loaderSrc = loaderOptions.src || [
        srcPath
      ];

      debug('psc-package %s %o', pscPackageCommand, pscPackageArgs);

      const cmd = spawn(pscPackageCommand, pscPackageArgs);

      if (cmd.error) {
        throw new Error(cmd.error);
      }
      else if (cmd.status !== 0) {
        const error = cmd.stdout.toString();

        throw new Error(error);
      }
      else {
        const result = cmd.stdout.toString().split(eol).filter(v => v != '').concat(loaderSrc);

        debug('psc-package result: %o', result);

        cache.srcOption = result;

        return result;
      }
    }
    else {
      const result = loaderOptions.src || [
        bowerPath,
        srcPath
      ];

      cache.srcOption = result;

      return result;
    }
  })(loaderOptions.pscPackage);

  const options = Object.assign({
    context: webpackConfig.context,
    psc: null,
    pscArgs: {},
    pscBundle: null,
    pscBundleArgs: {},
    pscIdeClient: null,
    pscIdeClientArgs: {},
    pscIdeServer: null,
    pscIdeServerArgs: {},
    pscIde: false,
    pscIdeColors: loaderOptions.psc === 'psa',
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

  if (!cache.installed) {
    debugVerbose('installing purs-loader with options: %O', options);

    cache.installed = true;

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
        errors: [],
        compilationStarted: false,
        compilationFinished: false,
        installed: cache.installed,
        srcOption: []
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
    source: source,
    load: ({js, map}) => callback(null, js, map),
    reject: error => callback(error),
    srcPath: this.resourcePath,
    remainingRequest: loaderUtils.getRemainingRequest(this),
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
      ide.rebuild(psModule)
      .then(() =>
        toJavaScript(psModule)
          .then(js => sourceMaps(psModule, js))
          .then(psModule.load)
          .catch(psModule.reject)
      )
      .catch(error => {
        if (error instanceof ide.UnknownModuleError) {
          // Store the modules that trigger a recompile due to an
          // unknown module error. We need to wait until compilation is
          // done before loading these files.

          cache.deferred.push(psModule);

          if (!cache.compilationStarted) {
            cache.compilationStarted = true;

            return compile(psModule)
              .then(() => {
                cache.compilationFinished = true;
              })
              .then(() =>
                Promise.map(cache.deferred, psModule =>
                  ide.load(psModule)
                    .then(() => toJavaScript(psModule))
                    .then(js => sourceMaps(psModule, js))
                    .then(psModule.load)
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
            // The compilation has started. We must wait until it is
            // done in order to ensure the module map contains all of
            // the unknown modules.
          }
        }
        else {
          debug('ide rebuild failed due to an unhandled error: %o', error);

          psModule.reject(error);
        }
      })
    ;

    connect().then(rebuild);
  }
  else if (cache.compilationFinished) {
    debugVerbose('compilation is already finished, loading module %s', psModule.name);

    toJavaScript(psModule)
      .then(js => sourceMaps(psModule, js))
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
          Promise.map(cache.deferred, psModule =>
            toJavaScript(psModule)
              .then(js => sourceMaps(psModule, js))
              .then(psModule.load)
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
