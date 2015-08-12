module PursLoader.LoaderRef
  ( LoaderRef()
  , Loader()
  , async
  , cacheable
  , query
  , clearDependencies
  , addDependency
  , resourcePath
  ) where

import Prelude (Unit())

import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Function (Fn3(), runFn3)
import Data.Maybe (Maybe(), fromMaybe, isJust)

data LoaderRef

foreign import data Loader :: !

foreign import asyncFn :: forall eff a. Fn3 (Maybe Error -> Boolean)
                                            (Error -> Maybe Error -> Error)
                                            LoaderRef
                                            (Eff (loader :: Loader | eff) (Maybe Error -> a -> Eff (loader :: Loader | eff) Unit))

async :: forall eff a. LoaderRef -> Eff (loader :: Loader | eff) (Maybe Error -> a -> Eff (loader :: Loader | eff) Unit)
async ref = runFn3 asyncFn isJust fromMaybe ref

foreign import cacheable :: forall eff. LoaderRef -> Eff (loader :: Loader | eff) Unit

foreign import query :: LoaderRef -> String

foreign import clearDependencies :: forall eff. LoaderRef -> Eff (loader :: Loader | eff) Unit

foreign import resourcePath :: LoaderRef -> String

foreign import addDependency :: forall eff. LoaderRef -> String -> Eff (loader :: Loader | eff) Unit
