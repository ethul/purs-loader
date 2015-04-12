module PursLoader.LoaderUtil
  ( getRemainingRequest
  , parseQuery
  ) where

import Data.Foreign (Foreign())

import PursLoader.LoaderRef (LoaderRef())

foreign import getRemainingRequest """
function getRemainingRequest(ref){
  var loaderUtils = require('loader-utils');
  return loaderUtils.getRemainingRequest(ref);
}""" :: LoaderRef -> String

foreign import parseQuery """
function parseQuery(query){
  var loaderUtils = require('loader-utils');
  return loaderUtils.parseQuery(query);
}""" :: String -> Foreign
