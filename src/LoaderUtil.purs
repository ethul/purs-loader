module PursLoader.LoaderUtil
  ( parseQuery
  ) where

import Data.Foreign (Foreign())

import PursLoader.LoaderRef (LoaderRef())

foreign import parseQuery """
function parseQuery(query){
  var loaderUtils = require('loader-utils');
  return loaderUtils.parseQuery(query);
}""" :: String -> Foreign
