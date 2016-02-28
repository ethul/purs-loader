module PursLoader.Debug (debug) where

import Prelude (Unit())

import Control.Monad.Eff (Eff())

import PursLoader.LoaderRef (Loader())

foreign import debug :: forall eff. String -> Eff (loader :: Loader | eff) Unit
