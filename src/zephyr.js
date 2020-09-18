'use strict';

const Promise = require('bluebird');

const spawn = require('cross-spawn');

const debug_ = require('debug');

const debug = debug_('purs-loader');

module.exports = function compile(psModule) {
  const options = psModule.options

  const zephyrCommand = 'zephyr';
  const zephyrArgs = [ psModule.name, "-i", options.output, "-o", options.output ];

  debug('zephyr %s %O', zephyrCommand, zephyrArgs)

  return new Promise((resolve, reject) => {
    debug('Running zephyr...')

    const zephyr = spawn(zephyrCommand, zephyrArgs)

    zephyr.on('close', code => {
      debug('finished compiling zephyr.')
      if (code !== 0) {
        psModule.emitError("Zephyr failed");
        reject(new Error('Zephyr failed'))
      } else {
        resolve(psModule);
      }
    })
  });
};
