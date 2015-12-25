module PursLoader.Path
  ( relative
  , resolve
  , dirname
  , joinPath
  ) where

foreign import relative :: String -> String -> String

foreign import resolve :: String -> String

foreign import dirname :: String -> String

foreign import joinPath :: String -> String -> String
