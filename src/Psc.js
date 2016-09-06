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

  debug('spawning compiler %s %o', options.psc, args)

  return (new Promise((resolve, reject) => {
    console.log('\nCompiling PureScript...')

    const compilation = spawn(options.psc, args)

    compilation.stdout.on('data', data => stderr.push(data.toString()))
    compilation.stderr.on('data', data => stderr.push(data.toString()))

    compilation.on('close', code => {
      console.log('Finished compiling PureScript.')
      cache.compilationFinished = true
      if (code !== 0) {
        cache.errors = stderr.join('')
        reject(true)
      } else {
        cache.warnings = stderr.join('')
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
    console.log('Bundling PureScript...')

    const compilation = spawn(options.pscBundle, args)

    compilation.stdout.on('data', data => stdout.push(data.toString()))
    compilation.stderr.on('data', data => stderr.push(data.toString()))
    compilation.on('close', code => {
      if (code !== 0) {
        cache.errors = (cache.errors || '') + stderr.join('')
        return reject(true)
      }
      cache.bundle = stderr
      resolve(fs.appendFileAsync(options.bundleOutput, `module.exports = ${options.bundleNamespace}`))
    })
  }))
}
