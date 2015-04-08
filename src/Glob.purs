module PursLoader.Glob
  ( Glob()
  , glob
  ) where

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Function

foreign import data Glob :: !

glob :: forall eff. String -> Aff (glob :: Glob | eff) [String]
glob pattern = makeAff $ runFn3 globFn pattern

foreign import globFn """
function globFn(pattern, errback, callback) {
  return function(){
    var glob = require('glob');

    glob(pattern, function(e, data){
      if (e) errback(e)();
      else callback(data)();
    });
  };
}
""" :: forall eff. Fn3 String
                       (Error -> Eff (glob :: Glob | eff) Unit)
                       ([String] -> Eff (glob :: Glob | eff) Unit)
                       (Eff (glob :: Glob | eff) Unit)
