module PursLoader.FS
  ( FS()
  , readFileUtf8
  , readFileUtf8Sync
  ) where

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Function

foreign import data FS :: !

readFileUtf8 :: forall eff. String -> Aff (fs :: FS | eff) String
readFileUtf8 filepath = makeAff $ runFn3 readFileUtf8Fn filepath

readFileUtf8Sync :: forall eff. String -> Eff (fs :: FS | eff) String
readFileUtf8Sync filepath = readFileUtf8SyncFn filepath

foreign import readFileUtf8Fn """
function readFileUtf8Fn(filepath, errback, callback) {
  return function(){
    var fs = require('fs');

    fs.readFile(filepath, 'utf-8', function(e, data){
      if (e) errback(e)();
      else callback(data)();
    });
  };
}
""" :: forall eff. Fn3 String
                       (Error -> Eff (fs :: FS | eff) Unit)
                       (String -> Eff (fs :: FS | eff) Unit)
                       (Eff (fs :: FS | eff) Unit)

foreign import readFileUtf8SyncFn """
function readFileUtf8SyncFn(filepath) {
  return function(){
    var fs = require('fs');

    return fs.readFileSync(filepath, {encoding: 'utf-8'});
  };
}
""" :: forall eff. String -> (Eff (fs :: FS | eff) String)
