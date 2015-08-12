module PursLoader.LoaderUtil
  ( parseQuery
  ) where

import Data.Foreign (Foreign())

import PursLoader.LoaderRef (LoaderRef())

foreign import parseQuery :: String -> Foreign
