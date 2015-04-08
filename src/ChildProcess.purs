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

    process.stdout.on('data', function(data){
      stdout = Buffer.concat([stdout, new Buffer(data)]);
    });

    process.on('close', function(code){
      if (code !== 0) errback(new Error(stdout.toString()))();
      else callback(stdout.toString())();
    });
  };
}
""" :: forall eff. Fn4 String
                       [String]
                       (Error -> Eff (cp :: ChildProcess | eff) Unit)
                       (String -> Eff (cp :: ChildProcess | eff) Unit)
                       (Eff (cp :: ChildProcess | eff) Unit)
