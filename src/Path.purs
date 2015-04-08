module PursLoader.Path
  ( dirname
  , join
  , relative
  , resolve
  ) where

foreign import dirname """
function dirname(filepath) {
  var path = require('path');
  return path.dirname(filepath);
}
""" :: String -> String

foreign import join """
function join(parts) {
  var path = require('path');
  return path.join.apply(path, parts);
}
""" :: [String] -> String

foreign import relative """
function relative(from) {
  return function(to){
    var path = require('path');
    return path.relative(from, to);
  };
}
""" :: String -> String -> String

foreign import resolve """
function resolve(filepath) {
  var path = require('path');
  return path.resolve(filepath);
}
""" :: String -> String
