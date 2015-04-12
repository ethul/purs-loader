module PursLoader.LoaderRef
  ( LoaderRef()
  , Loader()
  , async
  , cacheable
  , clearDependencies
  , resourcePath
  , addDependency
  , query
  ) where

import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error())

import Data.Foreign (Foreign())
import Data.Function (Fn3(), runFn3)
import Data.Maybe (Maybe(), fromMaybe, isJust)

data LoaderRef

foreign import data Loader :: !

foreign import asyncFn """
function asyncFn(isJust, fromMaybe, ref){
  return function(){
    var callback = ref.async();
    return function(error){
      return function(value){
        return function(){
          return isJust(error) ? callback(fromMaybe(new Error())(error))
                               : callback(null, value);
        };
      };
    };
  };
}""" :: forall eff a. Fn3 (Maybe Error -> Boolean)
                          (Error -> Maybe Error -> Error)
                          LoaderRef
                          (Eff (loader :: Loader | eff) (Maybe Error -> a -> Eff (loader :: Loader | eff) Unit))

async :: forall eff a. LoaderRef -> Eff (loader :: Loader | eff) (Maybe Error -> a -> Eff (loader :: Loader | eff) Unit)
async ref = runFn3 asyncFn isJust fromMaybe ref

foreign import cacheable """
function cacheable(ref){
  return function(){
    return ref.cacheable && ref.cacheable();
  };
}""" :: forall eff. LoaderRef -> Eff (loader :: Loader | eff) Unit

foreign import clearDependencies """
function clearDependencies(ref){
  return function(){
    return ref.clearDependencies();
  };
}""" :: forall eff. LoaderRef -> Eff (loader :: Loader | eff) Unit

foreign import resourcePath """
function resourcePath(ref){
  return ref.resourcePath;
}""" :: LoaderRef -> String

foreign import addDependency """
function addDependency(ref){
  return function(dep){
    return function(){
      return ref.addDependency(dep);
    };
  };
}""" :: forall eff. LoaderRef -> String -> Eff (loader :: Loader | eff) Unit

foreign import query """
function query(ref){
  return ref.query;
}""" :: LoaderRef -> String
