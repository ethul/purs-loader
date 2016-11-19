'use strict';

const path = require('path');

const Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs'));

const retryPromise = require('promise-retry');

const spawn = require('cross-spawn');

const colors = require('chalk');

const debug = require('debug')('purs-loader');

const dargs = require('./dargs');

const Psc = require('./Psc');

const PsModuleMap = require('./PsModuleMap');

function connect(psModule) {
  const options = psModule.options
  const cache = psModule.cache

  if (cache.ideServer) return Promise.resolve(psModule)

  cache.ideServer = true

  const connect_ = () => new Promise((resolve, reject) => {
    const args = dargs(options.pscIdeArgs)

    debug('attempting to connect to psc-ide-server', args)

    const ideClient = spawn('psc-ide-client', args)

    ideClient.stderr.on('data', data => {
      debug(data.toString())
      cache.ideServer = false
      reject(new Error('psc-ide-client failed'))
    })
    ideClient.stdout.once('data', data => {
      debug(data.toString())
      if (data.toString()[0] === '{') {
        const res = JSON.parse(data.toString())
        if (res.resultType === 'success') {
          cache.ideServer = ideServer
          resolve(psModule)
        } else {
          cache.ideServer = ideServer
          reject(new Error('psc-ide-client failed'))
        }
      } else {
        cache.ideServer = false
        reject(new Error('psc-ide-client failed'))
      }
    })
    ideClient.stdin.resume()
    ideClient.stdin.write(JSON.stringify({ command: 'load' }))
    ideClient.stdin.write('\n')
  })

  const args = dargs(Object.assign({
    outputDirectory: options.output,
  }, options.pscIdeArgs))

  debug('attempting to start psc-ide-server', args)

  const ideServer = cache.ideServer = spawn('psc-ide-server', [])
  ideServer.stderr.on('data', data => {
    debug(data.toString())
  })

  return retryPromise((retry, number) => {
    return connect_().catch(error => {
      if (!cache.ideServer && number === 9) {
        debug(error)

        console.warn('Failed to connect to or start psc-ide-server. A full compilation will occur on rebuild');

        return Promise.resolve(psModule)
      }

      return retry(error)
    })
  }, {
    retries: 9,
    factor: 1,
    minTimeout: 333,
    maxTimeout: 333,
  })
}
module.exports.connect = connect;

function rebuild(psModule) {
  const options = psModule.options
  const cache = psModule.cache

  debug('attempting rebuild with psc-ide-client %s', psModule.srcPath)

  const request = (body) => new Promise((resolve, reject) => {
    const args = dargs(options.pscIdeArgs)
    const ideClient = spawn('psc-ide-client', args)

    var stdout = ''
    var stderr = ''

    ideClient.stdout.on('data', data => {
      stdout = stdout + data.toString()
    })

    ideClient.stderr.on('data', data => {
      stderr = stderr + data.toString()
    })

    ideClient.on('close', code => {
      if (code !== 0) {
        const error = stderr === '' ? 'Failed to spawn psc-ide-client' : stderr
        return reject(new Error(error))
      }

      let res = null

      try {
        res = JSON.parse(stdout.toString())
        debug(res)
      } catch (err) {
        return reject(err)
      }

      if (res && !Array.isArray(res.result)) {
        return resolve(psModule);
      }

      Promise.map(res.result, (item, i) => {
        debug(item)
        return formatIdeResult(item, options, i, res.result.length)
      })
      .then(compileMessages => {
        if (res.resultType === 'error') {
          if (res.result.some(item => {
            const isUnknownModule = item.errorCode === 'UnknownModule';

            const isUnknownModuleImport = item.errorCode === 'UnknownName' && /Unknown module/.test(item.message);

            return isUnknownModule || isUnknownModuleImport;
          })) {
            debug('unknown module, attempting full recompile')
            return Psc.compile(psModule)
              .then(() => PsModuleMap.makeMap(options.src).then(map => {
                debug('rebuilt module map');
                cache.psModuleMap = map;
              }))
              .then(() => request({ command: 'load' }))
              .then(resolve)
              .catch(() => resolve(psModule))
          }
          cache.errors = compileMessages.join('\n')
          resolve(psModule);
        } else {
          cache.warnings = compileMessages.join('\n')
          resolve(psModule)
        }
      })
    })

    ideClient.stdin.write(JSON.stringify(body))
    ideClient.stdin.write('\n')
  })

  return request({
    command: 'rebuild',
    params: {
      file: psModule.srcPath,
    }
  })
}
module.exports.rebuild = rebuild;

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
    })
  }

  return result.filename && result.position ? makeResultSnippet(result.filename, result.position) : makeResult();
}
