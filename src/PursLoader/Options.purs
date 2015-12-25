module PursLoader.Options
  ( Options()
  , runOptions
  ) where

import Prelude ((<$>), (<<<), id)

import Data.Foreign.Class (IsForeign, readProp)
import Data.Foreign.NullOrUndefined (runNullOrUndefined)
import Data.Maybe (maybe)

import PursLoader.Path (joinPath)

newtype Options = Options { pscBundle :: String }

type Options_ = { pscBundle :: String }

runOptions :: Options -> Options_
runOptions (Options options) = options

instance isForeignOptions :: IsForeign Options where
  read obj =
    Options <$> ({ pscBundle: _ }
            <$> (maybe pscBundleDefault id <<< runNullOrUndefined <$> readProp pscBundle obj))
    where
    pscBundle :: String
    pscBundle = "pscBundle"

    pscBundleDefault :: String
    pscBundleDefault = joinPath "output" "bundle.js"
