'use strict';

const path = require('path');

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))

const spawn = require('cross-spawn')

const debug = require('debug')('purs-loader');

const dargs = require('./dargs');

function compile(psModule) {
  const options = psModule.options
  const cache = psModule.cache
  const stderr = []

  if (cache.compilationStarted) return Promise.resolve(psModule)

  cache.compilationStarted = true

  const args = dargs(Object.assign({
    _: options.src,
    output: options.output,
  }, options.pscArgs))

  return (new Promise((resolve, reject) => {
    debug('compiling PureScript...')

    let compilation;

    if (options.customNodePath) {
      debug('spawning compiler %s %s %o', options.customNodePath, options.psc, args)

      compilation = spawn(options.customNodePath, [options.psc, ...args])
    }
    else {
      debug('spawning compiler %s %o', options.psc, args)
      compilation = spawn(options.psc, args)
    }

    compilation.stderr.on('data', data => {
      stderr.push(data.toString());
    });

    compilation.on('close', code => {
      debug('finished compiling PureScript.')
      cache.compilationFinished = true
      if (code !== 0) {
        const errorMessage = stderr.join('');
        if (errorMessage.length) {
          psModule.emitError(errorMessage);
        }
        if (options.watch) {
          resolve(psModule);
        }
        else {
          reject(new Error('compilation failed'))
        }
      } else {
        const warningMessage = stderr.join('');
        if (options.warnings && warningMessage.length) {
          psModule.emitWarning(warningMessage);
        }
        resolve(psModule)
      }
    })
  }))
  .then(compilerOutput => {
    if (options.bundle) {
      return bundle(options, cache).then(() => psModule)
    }
    return psModule
  })
}
module.exports.compile = compile;

function bundle(options, cache) {
  if (cache.bundle) return Promise.resolve(cache.bundle)

  const stdout = []
  const stderr = cache.bundle = []

  const args = dargs(Object.assign({
    _: [path.join(options.output, '*', '*.js')],
    output: options.bundleOutput,
    namespace: options.bundleNamespace,
  }, options.pscBundleArgs))

  cache.bundleModules.forEach(name => args.push('--module', name))

  debug('spawning bundler %s %o', options.pscBundle, args.join(' '))

  return (new Promise((resolve, reject) => {
    debug('bundling PureScript...')

    const compilation = spawn(options.pscBundle, args)

    compilation.stdout.on('data', data => stdout.push(data.toString()))
    compilation.stderr.on('data', data => stderr.push(data.toString()))
    compilation.on('close', code => {
      debug('finished bundling PureScript.')
      if (code !== 0) {
        const errorMessage = stderr.join('');
        if (errorMessage.length) {
          psModule.emitError(errorMessage);
        }
        return reject(new Error('bundling failed'))
      }
      cache.bundle = stderr
      resolve(fs.appendFileAsync(options.bundleOutput, `module.exports = ${options.bundleNamespace}`))
    })
  }))
}
