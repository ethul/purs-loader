
module.exports = class PurescriptLoaderCacheWeakMap {
  constructor() {
    this._map = new WeakMap();
  }

  intern(webpackConfig) {
    if (!this._map.has(webpackConfig)) {
      this._map.set(webpackConfig, {
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
      });
    }

    return this._map.get(webpackConfig);
  }

  invalidate(webpackConfig, options, cache) {
    const newCache = {
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

    this._map.set(webpackConfig, newCache);
    return newCache;
  }
};
