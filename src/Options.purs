module PursLoader.Options
  ( pscOptions
  , loaderSrcOption
  ) where

import Data.Array (concat)
import Data.Either (either)

import Data.Foreign (Foreign(), F())
import Data.Foreign.Class (IsForeign, read, readProp)
import Data.Foreign.NullOrUndefined (NullOrUndefined(..), runNullOrUndefined)

import Data.Maybe (Maybe(..), maybe, fromMaybe)

noPreludeOpt = "no-prelude"

noOptsOpt = "no-opts"

noMagicDoOpt = "no-magic-do"

noTcoOpt = "no-tco"

verboseErrorsOpt = "verbose-errors"

outputOpt = "output"

commentsOpt = "comments"

noPrefixOpt = "no-prefix"

requirePathOpt = "require-path"

srcOpt = "src"

ffiOpt = "ffi"

newtype Options
  = Options { noPrelude :: NullOrUndefined Boolean
            , noOpts :: NullOrUndefined Boolean
            , noMagicDo :: NullOrUndefined Boolean
            , noTco :: NullOrUndefined Boolean
            , verboseErrors :: NullOrUndefined Boolean
            , comments :: NullOrUndefined Boolean
            , output :: NullOrUndefined String
            , noPrefix :: NullOrUndefined Boolean
            , requirePath :: NullOrUndefined String
            , src :: NullOrUndefined [String]
            , ffi :: NullOrUndefined [String]
            }

instance isForeignOptions :: IsForeign Options where
  read obj = Options <$> ({ noPrelude: _
                          , noOpts: _
                          , noMagicDo: _
                          , noTco: _
                          , verboseErrors: _
                          , comments: _
                          , output: _
                          , noPrefix: _
                          , requirePath: _
                          , src: _
                          , ffi: _
                          } <$> readProp noPreludeOpt obj
                            <*> readProp noOptsOpt obj
                            <*> readProp noMagicDoOpt obj
                            <*> readProp noTcoOpt obj
                            <*> readProp verboseErrorsOpt obj
                            <*> readProp commentsOpt obj
                            <*> readProp outputOpt obj
                            <*> readProp noPrefixOpt obj
                            <*> readProp requirePathOpt obj
                            <*> readProp srcOpt obj
                            <*> readProp ffiOpt obj)

class LoaderOption a where
  opt :: String -> NullOrUndefined a -> [String]

instance booleanLoaderOption :: LoaderOption Boolean where
  opt key val = maybe [] (\a -> if a then ["--" ++ key] else []) (runNullOrUndefined val)

instance stringLoaderOption :: LoaderOption String where
  opt key val = maybe [] (\a -> ["--" ++ key ++ "=" ++ a]) (runNullOrUndefined val)

instance arrayLoaderOption :: (LoaderOption a) => LoaderOption [a] where
  opt key val = concat (opt key <$> (NullOrUndefined <<< Just)
                                <$> (fromMaybe [] (runNullOrUndefined val)))

pscOptions :: Foreign -> [String]
pscOptions query = either (const []) fold parsed
  where parsed = read query :: F Options
        fold (Options a) = opt noPreludeOpt a.noPrelude <>
                           opt noOptsOpt a.noOpts <>
                           opt noMagicDoOpt a.noMagicDo <>
                           opt noTcoOpt a.noTco <>
                           opt verboseErrorsOpt a.verboseErrors <>
                           opt commentsOpt a.comments <>
                           opt outputOpt a.output <>
                           opt noPrefixOpt a.noPrefix <>
                           opt requirePathOpt a.requirePath <>
                           opt ffiOpt a.ffi

loaderSrcOption :: Foreign -> Maybe [String]
loaderSrcOption query = either (const Nothing) (\(Options a) -> runNullOrUndefined a.src) (read query)
