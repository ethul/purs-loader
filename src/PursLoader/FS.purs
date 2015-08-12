module PursLoader.FS
  ( FS()
  , writeFileUtf8
  , findFileUtf8
  ) where

import Prelude (Unit(), ($))

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Maybe (Maybe(..))
import Data.String.Regex (Regex())

import Data.Function

foreign import data FS :: !

writeFileUtf8 :: forall eff. String -> String -> Aff (fs :: FS | eff) Unit
writeFileUtf8 filepath contents = makeAff $ runFn4 writeFileUtf8Fn filepath contents

foreign import writeFileUtf8Fn :: forall eff. Fn4 String
                                                  String
                                                  (Error -> Eff (fs :: FS | eff) Unit)
                                                  (Unit -> Eff (fs :: FS | eff) Unit)
                                                  (Eff (fs :: FS | eff) Unit)

findFileUtf8 :: forall eff. Regex -> Array String -> Aff (fs :: FS | eff) (Maybe String)
findFileUtf8 regexp filepaths = makeAff $ runFn6 findFileUtf8Fn Nothing Just regexp filepaths

foreign import findFileUtf8Fn :: forall eff. Fn6 (Maybe String)
                                                 (String -> Maybe String)
                                                 Regex
                                                 (Array String)
                                                 (Error -> Eff (fs :: FS | eff) Unit)
                                                 (Maybe String -> Eff (fs :: FS | eff) Unit)
                                                 (Eff (fs :: FS | eff) Unit)
