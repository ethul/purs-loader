module PursLoader.Glob
  ( Glob()
  , globAll
  ) where

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Function

foreign import data Glob :: !

globAll :: forall eff. [String] -> Aff (glob :: Glob | eff) [[String]]
globAll patterns = makeAff $ runFn3 globAllFn patterns

foreign import globAllFn """
function globAllFn(patterns, errback, callback) {
  return function(){
    var glob = require('glob');

    var async = require('async');

    async.map(patterns, glob, function(error, result){
      if (error) errback(new Error(error))();
      else callback(result)();
    });
  };
}
""" :: forall eff. Fn3 [String]
                       (Error -> Eff (glob :: Glob | eff) Unit)
                       ([[String]] -> Eff (glob :: Glob | eff) Unit)
                       (Eff (glob :: Glob | eff) Unit)
