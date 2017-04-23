'use strict';

const path = require('path');

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))

const spawn = require('cross-spawn')

const debug = require('debug')('purs-loader');

const dargs = require('./dargs');

module.exports = function bundle(options, bundleModules) {
  const stdout = []

  const stderr = []

  const bundleCommand = options.pscBundle || 'purs';

  const bundleArgs = (options.pscBundle ? [] : [ 'bundle' ]).concat(dargs(Object.assign({
    _: [path.join(options.output, '*', '*.js')],
    output: options.bundleOutput,
    namespace: options.bundleNamespace,
  }, options.pscBundleArgs)));

  bundleModules.forEach(name => bundleArgs.push('--module', name))

  debug('bundle: %s %o', bundleCommand, bundleArgs);

  return (new Promise((resolve, reject) => {
    debug('bundling PureScript...')

    const compilation = spawn(bundleCommand, bundleArgs)

    compilation.stdout.on('data', data => stdout.push(data.toString()))

    compilation.stderr.on('data', data => stderr.push(data.toString()))

    compilation.on('close', code => {
      debug('finished bundling PureScript.')

      if (code !== 0) {
        const errorMessage = stderr.join('');

        if (errorMessage.length) {
          psModule.emitError(errorMessage);
        }

        reject(new Error('bundling failed'))
      }
      else {
        resolve(fs.appendFileAsync(options.bundleOutput, `module.exports = ${options.bundleNamespace}`))
      }
    })
  }))
};
