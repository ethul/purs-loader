module PursLoader.ChildProcess
  ( ChildProcess()
  , spawn
  ) where

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Function

foreign import data ChildProcess :: !

spawn :: forall eff. String -> [String] -> Aff (cp :: ChildProcess | eff) String
spawn command args = makeAff $ runFn4 spawnFn command args

foreign import spawnFn """
function spawnFn(command, args, errback, callback) {
  return function(){
    var child_process = require('child_process');

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
      var chalk = require('chalk');

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
""" :: forall eff. Fn4 String
                       [String]
                       (Error -> Eff (cp :: ChildProcess | eff) Unit)
                       (String -> Eff (cp :: ChildProcess | eff) Unit)
                       (Eff (cp :: ChildProcess | eff) Unit)
