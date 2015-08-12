module PursLoader.Glob
  ( Glob()
  , globAll
  ) where

import Prelude (Unit(), ($))

import Control.Monad.Aff (Aff(), makeAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Function

foreign import data Glob :: !

globAll :: forall eff. Array String -> Aff (glob :: Glob | eff) (Array (Array String))
globAll patterns = makeAff $ runFn3 globAllFn patterns

foreign import globAllFn :: forall eff. Fn3 (Array String)
                                            (Error -> Eff (glob :: Glob | eff) Unit)
                                            ((Array (Array String)) -> Eff (glob :: Glob | eff) Unit)
                                            (Eff (glob :: Glob | eff) Unit)
