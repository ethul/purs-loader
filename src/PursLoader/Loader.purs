module PursLoader.Loader
  ( Effects()
  , loader
  , loaderFn
  ) where

import Prelude (Unit(), ($), (<>), (>>=), (<$>), (++), bind, flip, id, pure, return, unit, show)

import Control.Monad.Aff (Aff(), runAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Class (liftEff)
import Control.Monad.Eff.Exception (throwException, error, EXCEPTION())

import Data.Array ((!!), concat)
import Data.Function (Fn2(), mkFn2)
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.Either (Either(..))
import Data.String (joinWith)
import Data.String.Regex (Regex(), match, noFlags, regex, test)
import Data.Traversable (sequence)
import Data.Foreign (F())
import Data.Foreign.Class (read)

import PursLoader.ChildProcess (ChildProcess(), spawn)
import PursLoader.FS (FS(), writeFileUtf8, findFileUtf8)
import PursLoader.Glob (Glob(), globAll)
import PursLoader.LoaderRef (LoaderRef(), Loader(), async, cacheable, query, clearDependencies, addDependency, resourcePath)
import PursLoader.LoaderUtil (parseQuery)
import PursLoader.Options (loaderFFIOption, loaderSrcOption, pscOptions, Options(), output)

type Effects eff = (cp :: ChildProcess, fs :: FS, glob :: Glob, loader :: Loader, err :: EXCEPTION | eff)

moduleRegex :: Regex
moduleRegex = regex "(?:^|\\n)module\\s+([\\w\\.]+)" noFlags { ignoreCase = true }

foreignRegex :: Regex
foreignRegex = regex "(?:^|\\n)\\s*foreign import\\s+" noFlags { ignoreCase = true }

pscCommand :: String
pscCommand = "psc"

psciCommand :: String
psciCommand = "psci"

psciFilename :: String
psciFilename = ".psci"

(!!!) :: forall a. Int -> Array a -> Maybe a
(!!!) = flip (!!)

foreign import cwd :: String

foreign import relative :: String -> String -> String

foreign import resolve :: String -> String

foreign import dirname :: String -> String

foreign import joinPath :: String -> String -> String

mkPsci :: Array (Array String) -> Array (Array String) -> String
mkPsci srcs ffis = joinWith "\n" ((loadModule <$> concat srcs) <> (loadForeign <$> concat ffis))
  where
    loadModule :: String -> String
    loadModule a = ":m " ++ relative cwd a

    loadForeign :: String -> String
    loadForeign a = ":f " ++ relative cwd a

findFFI :: forall eff. Array (Array String) -> String -> Aff (fs :: FS | eff) (Maybe String)
findFFI ffiss name = findFileUtf8 re (concat ffiss)
  where
    re = regex ("(?:^|\\n)//\\s*module\\s*" ++ name ++ "\\s*\\n") noFlags

loader' :: forall eff. LoaderRef -> String -> Aff (Effects eff) (Maybe String)
loader' ref source = do
  liftEff $ cacheable ref

  let parsed = parseQuery $ query ref
      srcs = fromMaybe [] (loaderSrcOption parsed)
      ffis = fromMaybe [] (loaderFFIOption parsed)

  case read parsed :: F Options of
    Left e -> liftEff (throwException (error (show e)))
    Right opts -> do
      let pscOpts = pscOptions opts

      srcss <- globAll srcs
      ffiss <- globAll ffis

      let psciFile = mkPsci srcss ffiss

      writeFileUtf8 psciFilename psciFile

      let moduleName = match moduleRegex source >>= (!!!) 1 >>= id
          hasForeign = test foreignRegex source
          outputDir = resolve (output opts)
          resourceDir = dirname (resourcePath ref)
          result = (\a -> "module.exports = require('" ++ relative resourceDir (joinPath outputDir a) ++ "');") <$> moduleName

      liftEff do
        clearDependencies ref
        addDependency ref (resourcePath ref)
        sequence $ (\src -> addDependency ref (resolve src)) <$> concat srcss

      foreignPath <- if hasForeign
                        then fromMaybe (pure Nothing) (findFFI ffiss <$> moduleName)
                        else pure Nothing

      fromMaybe (pure unit) ((\path -> liftEff (addDependency ref path)) <$> foreignPath)

      spawn pscCommand (srcs <> pscOpts)

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
