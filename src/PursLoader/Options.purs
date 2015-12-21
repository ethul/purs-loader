module PursLoader.Options
  ( pscOptions
  , loaderSrcOption
  , loaderFFIOption
  , Options()
  , output
  ) where

import Prelude ((<>), (<$>), (<<<), (++), (<*>), ($), const, id)

import Data.Array (concat)
import Data.Either (either)

import Data.Foreign (Foreign())
import Data.Foreign.Class (IsForeign, read, readProp)
import Data.Foreign.NullOrUndefined (NullOrUndefined(..), runNullOrUndefined)

import Data.Maybe (Maybe(..), maybe, fromMaybe)

noPreludeOpt :: String
noPreludeOpt = "no-prelude"

noOptsOpt :: String
noOptsOpt = "no-opts"

noMagicDoOpt :: String
noMagicDoOpt = "no-magic-do"

noTcoOpt :: String
noTcoOpt = "no-tco"

verboseErrorsOpt :: String
verboseErrorsOpt = "verbose-errors"

outputOpt :: String
outputOpt = "output"

commentsOpt :: String
commentsOpt = "comments"

noPrefixOpt :: String
noPrefixOpt = "no-prefix"

requirePathOpt :: String
requirePathOpt = "require-path"

srcOpt :: String
srcOpt = "src"

ffiOpt :: String
ffiOpt = "ffi"

newtype Options
  = Options { noPrelude :: NullOrUndefined Boolean
            , noOpts :: NullOrUndefined Boolean
            , noMagicDo :: NullOrUndefined Boolean
            , noTco :: NullOrUndefined Boolean
            , verboseErrors :: NullOrUndefined Boolean
            , comments :: NullOrUndefined Boolean
            , output :: String
            , noPrefix :: NullOrUndefined Boolean
            , requirePath :: String
            , src :: NullOrUndefined (Array String)
            , ffi :: NullOrUndefined (Array String)
            }

output :: Options -> String
output (Options o) = o.output

instance isForeignOptions :: IsForeign Options where
  read obj = Options <$> ({ noPrelude: _
                          , noOpts: _
                          , noMagicDo: _
                          , noTco: _
                          , verboseErrors: _
                          , comments: _
                          , output: _
                          , noPrefix: _
                          , requirePath: "../"
                          , src: _
                          , ffi: _
                          } <$> readProp noPreludeOpt obj
                            <*> readProp noOptsOpt obj
                            <*> readProp noMagicDoOpt obj
                            <*> readProp noTcoOpt obj
                            <*> readProp verboseErrorsOpt obj
                            <*> readProp commentsOpt obj
                            <*> (maybe "output" id <<< runNullOrUndefined <$> readProp outputOpt obj)
                            <*> readProp noPrefixOpt obj
                            <*> readProp srcOpt obj
                            <*> readProp ffiOpt obj)

class LoaderOption a where
  opt :: String -> NullOrUndefined a -> Array String

instance booleanLoaderOption :: LoaderOption Boolean where
  opt key val = maybe [] (\a -> if a then ["--" ++ key] else []) (runNullOrUndefined val)

instance stringLoaderOption :: LoaderOption String where
  opt key val = maybe [] (\a -> ["--" ++ key ++ "=" ++ a]) (runNullOrUndefined val)

instance arrayLoaderOption :: (LoaderOption a) => LoaderOption (Array a) where
  opt key val = concat (opt key <$> (NullOrUndefined <<< Just)
                                <$> (fromMaybe [] (runNullOrUndefined val)))

pscOptions :: Options -> Array String
pscOptions (Options a) = opt noPreludeOpt a.noPrelude <>
                         opt noOptsOpt a.noOpts <>
                         opt noMagicDoOpt a.noMagicDo <>
                         opt noTcoOpt a.noTco <>
                         opt verboseErrorsOpt a.verboseErrors <>
                         opt commentsOpt a.comments <>
                         opt outputOpt (NullOrUndefined $ Just a.output) <>
                         opt noPrefixOpt a.noPrefix <>
                         opt requirePathOpt (NullOrUndefined $ Just a.requirePath) <>
                         opt ffiOpt a.ffi

loaderSrcOption :: Foreign -> Maybe (Array String)
loaderSrcOption query = either (const Nothing) (\(Options a) -> runNullOrUndefined a.src) (read query)

loaderFFIOption :: Foreign -> Maybe (Array String)
loaderFFIOption query = either (const Nothing) (\(Options a) -> runNullOrUndefined a.ffi) (read query)
