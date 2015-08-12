module PursLoader.ChildProcess
  ( ChildProcess()
  , spawn
  ) where

import Prelude (Unit(), ($))

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Function

foreign import data ChildProcess :: !

spawn :: forall eff. String -> Array String -> Aff (cp :: ChildProcess | eff) String
spawn command args = makeAff $ runFn4 spawnFn command args

foreign import spawnFn :: forall eff. Fn4 String
                                          (Array String)
                                          (Error -> Eff (cp :: ChildProcess | eff) Unit)
                                          (String -> Eff (cp :: ChildProcess | eff) Unit)
                                          (Eff (cp :: ChildProcess | eff) Unit)
