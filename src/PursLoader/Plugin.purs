module PursLoader.Plugin
  ( Compile()
  , Context()
  , Options()
  , DependencyGraph()
  , dependenciesOf
  ) where

import Prelude (Unit())

import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Either (Either(..))
import Data.Function (Fn4(), runFn4)
import Data.Nullable (Nullable())

type Compile eff = Nullable Error -> DependencyGraph -> Eff eff Unit

type Context eff = { compile :: Compile eff -> Eff eff Unit, options :: Options }

type Options = { bundle :: Boolean, output :: String, bundleOutput :: String }

dependenciesOf :: DependencyGraph -> String -> Either Error (Array String)
dependenciesOf = runFn4 dependenciesOfFn Left Right

foreign import data DependencyGraph :: *

foreign import dependenciesOfFn
  :: Fn4 (Error -> Either Error (Array String))
         (Array String -> Either Error (Array String))
         DependencyGraph
         String
         (Either Error (Array String))
