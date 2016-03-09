module PursLoader.Plugin
  ( Result()
  , Compile()
  , Context()
  , Options()
  , ImmutableMap()
  , DependencyGraph()
  , get
  , dependenciesOf
  ) where

import Prelude (Unit())

import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Either (Either(..))
import Data.Function (Fn4(), runFn4)
import Data.Maybe (Maybe(..))
import Data.Nullable (Nullable())

type Result = { srcMap :: ImmutableMap String String, ffiMap :: ImmutableMap String String, graph :: DependencyGraph }

type Compile eff = Nullable Error -> Result -> Eff eff Unit

type Context eff = { compile :: Compile eff -> Eff eff Unit, options :: Options }

type Options = { bundle :: Boolean, output :: String, bundleOutput :: String }

get :: forall key value. ImmutableMap key value -> key -> Maybe value
get = runFn4 getFn Nothing Just

dependenciesOf :: DependencyGraph -> String -> Either Error (Array String)
dependenciesOf = runFn4 dependenciesOfFn Left Right

foreign import data ImmutableMap :: * -> * -> *

foreign import data DependencyGraph :: *

foreign import getFn
  :: forall key value. Fn4 (Maybe value)
                           (value -> Maybe value)
                           (ImmutableMap key value)
                           key
                           (Maybe value)

foreign import dependenciesOfFn
  :: Fn4 (Error -> Either Error (Array String))
         (Array String -> Either Error (Array String))
         DependencyGraph
         String
         (Either Error (Array String))
