module PursLoader.FS
  ( FS()
  , writeFileUtf8
  , findFileUtf8
  ) where

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Maybe (Maybe(..))
import Data.String.Regex (Regex())

import Data.Function

foreign import data FS :: !

writeFileUtf8 :: forall eff. String -> String -> Aff (fs :: FS | eff) Unit
writeFileUtf8 filepath contents = makeAff $ runFn4 writeFileUtf8Fn filepath contents

foreign import writeFileUtf8Fn """
function writeFileUtf8Fn(filepath, contents, errback, callback) {
  return function(){
    var fs = require('fs');

    fs.writeFile(filepath, contents, function(error){
      if (error) errback(error)();
      else callback()();
    });
  };
}
""" :: forall eff. Fn4 String
                       String
                       (Error -> Eff (fs :: FS | eff) Unit)
                       (Unit -> Eff (fs :: FS | eff) Unit)
                       (Eff (fs :: FS | eff) Unit)

findFileUtf8 :: forall eff. Regex -> [String] -> Aff (fs :: FS | eff) (Maybe String)
findFileUtf8 regexp filepaths = makeAff $ runFn6 findFileUtf8Fn Nothing Just regexp filepaths

foreign import findFileUtf8Fn """
function findFileUtf8Fn(nothing, just, regex, filepaths, errback, callback) {
  return function(){
    var fs = require('fs');

    var async = require('async');

    function findFile(filepath, callback) {
      fs.readFile(filepath, {encoding: 'utf-8'}, function(error, result){
        if (error) callback(false);
        else callback(regex.test(result));
      });
    }

    async.detect(filepaths, findFile, function(result){
      if (!result) callback(nothing)();
      else callback(just(result))();
    });
  };
}
""" :: forall eff. Fn6 (Maybe String)
                       (String -> Maybe String)
                       Regex
                       [String]
                       (Error -> Eff (fs :: FS | eff) Unit)
                       (Maybe String -> Eff (fs :: FS | eff) Unit)
                       (Eff (fs :: FS | eff) Unit)
