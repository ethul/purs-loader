module PursLoader.Options
  ( pscMakeOptions
  , pscMakeDefaultOutput
  , pscMakeOutputOption
  , loaderSrcOption
  ) where

import Data.Either (either)

import Data.Foreign (Foreign(), F())
import Data.Foreign.Class (IsForeign, read, readProp)
import Data.Foreign.NullOrUndefined (NullOrUndefined(), runNullOrUndefined)

import Data.Maybe (Maybe(..), maybe)

noPreludeOpt = "no-prelude"

noOptsOpt = "no-opts"

noMagicDoOpt = "no-magic-do"

noTcoOpt = "no-tco"

verboseErrorsOpt = "verbose-errors"

outputOpt = "output"

commentsOpt = "comments"

noPrefixOpt = "no-prefix"

srcOpt = "src"

pscMakeDefaultOutput = "output"

newtype Options
  = Options { noPrelude :: NullOrUndefined Boolean
            , noOpts :: NullOrUndefined Boolean
            , noMagicDo :: NullOrUndefined Boolean
            , noTco :: NullOrUndefined Boolean
            , verboseErrors :: NullOrUndefined Boolean
            , comments :: NullOrUndefined Boolean
            , output :: NullOrUndefined String
            , noPrefix :: NullOrUndefined Boolean
            , src :: NullOrUndefined [String]
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
                          , src: _
                          } <$> readProp noPreludeOpt obj
                            <*> readProp noOptsOpt obj
                            <*> readProp noMagicDoOpt obj
                            <*> readProp noTcoOpt obj
                            <*> readProp verboseErrorsOpt obj
                            <*> readProp commentsOpt obj
                            <*> readProp outputOpt obj
                            <*> readProp noPrefixOpt obj
                            <*> readProp srcOpt obj)

class LoaderOption a where
  opt :: String -> NullOrUndefined a -> [String]

instance booleanLoaderOption :: LoaderOption Boolean where
  opt key opt = maybe [] (\a -> if a then ["--" ++ key] else [])
                         (runNullOrUndefined opt)

instance stringLoaderOption :: LoaderOption String where
  opt key opt = maybe [] (\a -> ["--" ++ key ++ "=" ++ a])
                         (runNullOrUndefined opt)

pscMakeOutputOption :: Foreign -> Maybe String
pscMakeOutputOption query = either (const Nothing)
                                   (\(Options a) -> runNullOrUndefined a.output)
                                   (read query)

pscMakeOptions :: Foreign -> [String]
pscMakeOptions query = either (const []) fold parsed
  where parsed = read query :: F Options
        fold (Options a) = opt noPreludeOpt a.noPrelude <>
                           opt noOptsOpt a.noOpts <>
                           opt noMagicDoOpt a.noMagicDo <>
                           opt noTcoOpt a.noTco <>
                           opt verboseErrorsOpt a.verboseErrors <>
                           opt commentsOpt a.comments <>
                           opt outputOpt a.output <>
                           opt noPrefixOpt a.noPrefix

loaderSrcOption :: Foreign -> Maybe [String]
loaderSrcOption query = either (const Nothing)
                               (\(Options a) -> runNullOrUndefined a.src)
                               (read query)
