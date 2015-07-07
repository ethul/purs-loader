module PursLoader.Loader
  ( Effects()
  , loader
  , loaderFn
  ) where

import Control.Monad.Aff (Aff(), runAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Class (liftEff)
import Control.Monad.Eff.Exception (error)

import Data.Array ((!!), concat)
import Data.Function (Fn2(), mkFn2)
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.String (joinWith)
import Data.String.Regex (match, noFlags, regex)

import PursLoader.ChildProcess (ChildProcess(), spawn)
import PursLoader.FS (FS(), writeFileUtf8)
import PursLoader.Glob (Glob(), globAll)
import PursLoader.LoaderRef (LoaderRef(), Loader(), async, cacheable, query)
import PursLoader.LoaderUtil (parseQuery)
import PursLoader.Options (loaderFFIOption, loaderSrcOption, pscOptions)

type Effects eff = (cp :: ChildProcess, fs :: FS, glob :: Glob, loader :: Loader | eff)

moduleRegex = regex "(?:^|\\n)module\\s+([\\w\\.]+)" noFlags { ignoreCase = true }

pscCommand = "psc"

psciCommand = "psci"

psciFilename = ".psci"

(!!!) = flip (!!)

foreign import cwd "var cwd = process.cwd();" :: String

foreign import relative """
function relative(from) {
  return function(to){
    var path = require('path');
    return path.relative(from, to);
  };
}
""" :: String -> String -> String

mkPsci :: [[String]] -> [[String]] -> String
mkPsci srcs ffis = joinWith "\n" ((loadModule <$> concat srcs) <> (loadForeign <$> concat ffis))
  where
    loadModule :: String -> String
    loadModule a = ":m " ++ relative cwd a

    loadForeign :: String -> String
    loadForeign a = ":f " ++ relative cwd a

loader' :: forall eff. LoaderRef -> String -> Aff (Effects eff) (Maybe String)
loader' ref source = do
  liftEff $ cacheable ref

  let parsed = parseQuery $ query ref
      srcs = fromMaybe [] (loaderSrcOption parsed)
      ffis = fromMaybe [] (loaderFFIOption parsed)
      opts = pscOptions parsed

  spawn pscCommand (srcs <> opts)

  srcss <- globAll srcs
  ffiss <- globAll ffis

  let psciFile = mkPsci srcss ffiss

  writeFileUtf8 psciFilename psciFile

  let moduleName = match moduleRegex source >>= (!!!) 1
      result = (\a -> "module.exports = require('" ++ a ++ "');") <$> moduleName

  return result

loader :: forall eff. LoaderRef -> String -> Eff (Effects eff) Unit
loader ref source = do
  callback <- async ref
  runAff (\e -> callback (Just e) "")
         (maybe (callback (Just (error "Loader has failed to run")) "")
                (callback Nothing))
         (loader' ref source)

loaderFn :: forall eff. Fn2 LoaderRef String (Eff (Effects eff) Unit)
loaderFn = mkFn2 loader
