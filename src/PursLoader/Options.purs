module PursLoader.Options
  ( Options(..)
  , runOptions
  ) where

import Prelude ((<$>), (<<<), id)

import Data.Foreign.Class (IsForeign, readProp)
import Data.Foreign.NullOrUndefined (runNullOrUndefined)
import Data.Maybe (maybe)

import PursLoader.Path (joinPath)

newtype Options = Options { bundleOutput :: String }

type Options_ = { bundleOutput :: String }

runOptions :: Options -> Options_
runOptions (Options options) = options

instance isForeignOptions :: IsForeign Options where
  read obj =
    Options <$> ({ bundleOutput: _ }
            <$> (maybe bundleOutputDefault id <<< runNullOrUndefined <$> readProp bundleOutput obj))
    where
    bundleOutput :: String
    bundleOutput = "bundleOutput"

    bundleOutputDefault :: String
    bundleOutputDefault = joinPath "output" "bundle.js"
