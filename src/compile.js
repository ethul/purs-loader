'use strict';

const Promise = require('bluebird');

const spawn = require('cross-spawn');

const debug_ = require('debug');

const debug = debug_('purs-loader');

const debugVerbose = debug_('purs-loader:verbose');

const dargs = require('./dargs');

module.exports = function compile(psModule) {
  const options = psModule.options

  const compileCommand = options.psc || 'purs';

  const compileArgs = (options.psc ? [] : [ 'compile' ]).concat(dargs(Object.assign({
    _: options.src,
    output: options.output,
  }, options.pscArgs)))

  const stderr = [];

  debug('compile %s %O', compileCommand, compileArgs)

  return new Promise((resolve, reject) => {
    debug('compiling PureScript...')

    const compilation = spawn(compileCommand, compileArgs)

    compilation.stderr.on('data', data => {
      stderr.push(data.toString());
    });

    compilation.stdout.on('data', data => {
      // NB: it seems like the actual error details are printed to stdout
      // (at least on 0.15). So without this, you'll just get an error line
      // saying what file has the error, but not what the error is...
      //
      // Combined with the `stderr` of each file being combined above,
      // this has the unfortunate side effect of printing every file
      // compiled as a warning (assuming compilation succeeds).
      //
      // purs has --json-errors, and we should really be taking advantage of it here...
      stderr.push(data.toString());
      debugVerbose(data.toString());
    });

    compilation.on('close', code => {
      debug('finished compiling PureScript.')

      if (code !== 0) {
        const errorMessage = stderr.join('');
        if (errorMessage.length) {
          psModule.emitError(errorMessage);
        }
        if (options.watch) {
          resolve(psModule);
        }
        else {
          reject(new Error('compilation failed: ' + errorMessage))
        }
      } else {
        const warningMessage = stderr.join('');
        if (options.warnings && warningMessage.length) {
          psModule.emitWarning(warningMessage);
        }
        resolve(psModule)
      }
    })
  });
};
