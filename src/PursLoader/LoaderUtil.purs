module PursLoader.LoaderUtil
  ( parseQuery
  ) where

import Data.Foreign (Foreign())

foreign import parseQuery :: String -> Foreign
