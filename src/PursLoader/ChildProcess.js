'use strict';

// module PursLoader.ChildProcess

var child_process = require('child_process');

var chalk = require('chalk');

function spawnFn(command, args, errback, callback) {
  return function(){
    var process = child_process.spawn(command, args);

    var stdout = new Buffer(0);

    var stderr = new Buffer(0);

    process.stdout.on('data', function(data){
      stdout = Buffer.concat([stdout, new Buffer(data)]);
    });

    process.stderr.on('data', function(data){
      stderr = Buffer.concat([stderr, new Buffer(data)]);
    });

    process.on('close', function(code){
      var output = stdout.toString('utf-8');

      var error = stderr.toString('utf-8');

      if (error.length > 0) {
         console.error('\n' + chalk.red('*') + ' ' + error);
      }

      if (code !== 0) errback(new Error('Process terminated with code ' + code))();
      else callback(output)();
    });
  };
}

exports.spawnFn = spawnFn;
