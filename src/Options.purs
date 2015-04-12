module PursLoader.Options
  ( pscMakeOptions
  , pscMakeDefaultOutput
  , pscMakeOutputOption
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

pscMakeDefaultOutput = "output"

newtype Options
  = Options { noPrelude :: NullOrUndefined Boolean
            , noOpts :: NullOrUndefined Boolean
            , noMagicDo :: NullOrUndefined Boolean
            , noTco :: NullOrUndefined Boolean
            , verboseErrors :: NullOrUndefined Boolean
            , output :: NullOrUndefined String
            }

instance isForeignOptions :: IsForeign Options where
  read obj = (\a b c d e f ->
             Options { noPrelude: a
                     , noOpts: b
                     , noMagicDo: c
                     , noTco: d
                     , verboseErrors: e
                     , output: f
                     }) <$> readProp noPreludeOpt obj
                        <*> readProp noOptsOpt obj
                        <*> readProp noMagicDoOpt obj
                        <*> readProp noTcoOpt obj
                        <*> readProp verboseErrorsOpt obj
                        <*> readProp outputOpt obj

booleanOpt :: String -> NullOrUndefined Boolean -> [String]
booleanOpt key opt = maybe [] (\a -> if a then ["--" ++ key] else []) (runNullOrUndefined opt)

stringOpt :: String -> NullOrUndefined String -> [String]
stringOpt key opt = maybe [] (\a -> ["--" ++ key ++ "=" ++ a]) (runNullOrUndefined opt)

pscMakeOutputOption :: Foreign -> Maybe String
pscMakeOutputOption query = either (const Nothing)
                                   (\(Options a) -> runNullOrUndefined a.output)
                                   (read query)

pscMakeOptions :: Foreign -> [String]
pscMakeOptions query = either (const []) fold parsed
  where parsed = read query :: F Options
        fold (Options a) = booleanOpt noPreludeOpt a.noPrelude <>
                           booleanOpt noOptsOpt a.noOpts <>
                           booleanOpt noMagicDoOpt a.noMagicDo <>
                           booleanOpt noTcoOpt a.noTco <>
                           booleanOpt verboseErrorsOpt a.verboseErrors <>
                           stringOpt outputOpt a.output
