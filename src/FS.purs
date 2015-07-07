module PursLoader.FS
  ( FS()
  , writeFileUtf8
  ) where

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

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
