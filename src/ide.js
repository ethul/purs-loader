'use strict';

const path = require('path');

const Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs'));

const retryPromise = require('promise-retry');

const spawn = require('cross-spawn');

const colors = require('chalk');

const debug_ = require('debug');

const debug = debug_('purs-loader');

const debugVerbose = debug_('purs-loader:verbose');

const dargs = require('./dargs');

const compile = require('./compile');

const PsModuleMap = require('./purs-module-map');

function UnknownModuleError() {
  this.name = 'UnknownModuleError';
  this.stack = (new Error()).stack;
}

UnknownModuleError.prototype = Object.create(Error.prototype);

UnknownModuleError.prototype.constructor = UnknownModuleError;

module.exports.UnknownModuleError = UnknownModuleError;

function spawnIdeClient(body, options) {
  const ideClientCommand = 'purs';

  const ideClientArgs = ['ide', 'client'].concat(dargs(options.pscIdeArgs));

  const stderr = [];

  const stdout = [];

  debug('ide client %s %o %O', ideClientCommand, ideClientArgs, body);

  return new Promise((resolve, reject) => {
    const ideClient = spawn(ideClientCommand, ideClientArgs);

    ideClient.stderr.on('data', data => {
      stderr.push(data.toString());
    })

    ideClient.stdout.on('data', data => {
      stdout.push(data.toString());
    })

    ideClient.on('close', code => {
      if (code !== 0) {
        const errorMessage = stderr.join('');

        reject(new Error(`ide client failed: ${errorMessage}`));
      }
      else {
        const result = stdout.join('');

        resolve(result);
      }
    })

    ideClient.stdin.resume();

    ideClient.stdin.write(JSON.stringify(body));

    ideClient.stdin.write('\n');
  });
}

function formatIdeResult(result, options, index, length) {
  let numAndErr = `[${index+1}/${length} ${result.errorCode}]`
  numAndErr = options.pscIdeColors ? colors.yellow(numAndErr) : numAndErr

  function makeResult() {
    return Promise.resolve(`\n${numAndErr} ${result.message}`)
  }

  function makeResultSnippet(filename, pos) {
    const srcPath = path.relative(options.context, filename);
    const fileAndPos = `${srcPath}:${pos.startLine}:${pos.startColumn}`

    return fs.readFileAsync(filename, 'utf8').then(source => {
      const lines = source.split('\n').slice(pos.startLine - 1, pos.endLine)
      const endsOnNewline = pos.endColumn === 1 && pos.startLine !== pos.endLine
      const up = options.pscIdeColors ? colors.red('^') : '^'
      const down = options.pscIdeColors ? colors.red('v') : 'v'
      let trimmed = lines.slice(0)

      if (endsOnNewline) {
        lines.splice(lines.length - 1, 1)
        pos.endLine = pos.endLine - 1
        pos.endColumn = lines[lines.length - 1].length || 1
      }

      // strip newlines at the end
      if (endsOnNewline) {
        trimmed = lines.reverse().reduce((trimmed, line, i) => {
          if (i === 0 && line === '') trimmed.trimming = true
          if (!trimmed.trimming) trimmed.push(line)
          if (trimmed.trimming && line !== '') {
            trimmed.trimming = false
            trimmed.push(line)
          }
          return trimmed
        }, []).reverse()
        pos.endLine = pos.endLine - (lines.length - trimmed.length)
        pos.endColumn = trimmed[trimmed.length - 1].length || 1
      }

      const spaces = ' '.repeat(String(pos.endLine).length)
      let snippet = trimmed.map((line, i) => {
        return `  ${pos.startLine + i}  ${line}`
      }).join('\n')

      if (trimmed.length === 1) {
        snippet += `\n  ${spaces}  ${' '.repeat(pos.startColumn - 1)}${up.repeat(pos.endColumn - pos.startColumn + 1)}`
      } else {
        snippet = `  ${spaces}  ${' '.repeat(pos.startColumn - 1)}${down}\n${snippet}`
        snippet += `\n  ${spaces}  ${' '.repeat(pos.endColumn - 1)}${up}`
      }

      return Promise.resolve(`\n${numAndErr} ${fileAndPos}\n\n${snippet}\n\n${result.message}`)
    }).catch(error => {
      debug('failed to format ide result: %o', error);

      return Promise.resolve('');
    });
  }

  return result.filename && result.position ? makeResultSnippet(result.filename, result.position) : makeResult();
}

module.exports.connect = function connect(psModule) {
  const options = psModule.options

  const serverCommand = 'purs';

  const serverArgs = ['ide', 'server'].concat(dargs(Object.assign({
    outputDirectory: options.output,
    '_': options.src
  }, options.pscIdeServerArgs)));

  debug('ide server: %s %o', serverCommand, serverArgs);

  const ideServer = spawn(serverCommand, serverArgs);

  ideServer.stdout.on('data', data => {
    debugVerbose('ide server stdout: %s', data.toString());
  });

  ideServer.stderr.on('data', data => {
    debugVerbose('ide server stderr: %s', data.toString());
  });

  ideServer.on('error', error => {
    debugVerbose('ide server error: %o', error);
  });

  ideServer.on('close', (code, signal) => {
    debugVerbose('ide server close: %s %s', code, signal);
  });

  return Promise.resolve(ideServer);
};

module.exports.load = function load(psModule) {
  const options = psModule.options

  const body = {command: 'load'};

  return spawnIdeClient(body, options);
};

module.exports.loadWithRetry = function loadWithRetry(psModule) {
  const retries = 9;

  return retryPromise((retry, number) => {
    debugVerbose('attempting to load modules (%d out of %d attempts)', number, retries);

    return module.exports.load(psModule).catch(retry);
  }, {
    retries: retries,
    factor: 1,
    minTimeout: 333,
    maxTimeout: 333,
  }).then(() => psModule);
};

module.exports.rebuild = function rebuild(psModule) {
  const options = psModule.options;

  const body = {
    command: 'rebuild',
    params: {
      file: psModule.srcPath,
    }
  };

  const parseResponse = response => {
    try {
      const parsed = JSON.parse(response);

      debugVerbose('parsed JSON response: %O', parsed);

      return Promise.resolve(parsed);
    }
    catch (error) {
      return Promise.reject(error);
    }
  };

  const formatResponse = parsed => {
    const result = Array.isArray(parsed.result) ? parsed.result : [];

    return Promise.map(result, (item, i) => {
      debugVerbose('formatting result %O', item);

      return formatIdeResult(item, options, i, result.length);
    }).then(formatted => ({
      parsed: parsed,
      formatted: formatted,
      formattedMessage: formatted.join('\n')
    }));
  };

  return spawnIdeClient(body, options)
    .then(parseResponse)
    .then(formatResponse)
    .then(({ parsed, formatted, formattedMessage }) => {
      if (parsed.resultType === 'success') {
        if (options.warnings && formattedMessage.length) {
          psModule.emitWarning(formattedMessage);
        }

        return psModule;
      }
      else if ((parsed.result || []).some(item => {
          const isModuleNotFound = item.errorCode === 'ModuleNotFound';

          const isUnknownModule = item.errorCode === 'UnknownModule';

          const isUnknownModuleImport = item.errorCode === 'UnknownName' && /Unknown module/.test(item.message);

          return isModuleNotFound || isUnknownModule || isUnknownModuleImport;
      })) {
        debug('module %s was not rebuilt because the module is unknown', psModule.name);

        return Promise.reject(new UnknownModuleError());
      }
      else {
        if (formattedMessage.length) {
          psModule.emitError(formattedMessage);
        }

        return psModule;
      }
    })
  ;
};
