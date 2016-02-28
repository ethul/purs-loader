module PursLoader.Loader
  ( Effects()
  , loader
  , loaderFn
  ) where

import Prelude (Unit(), ($), (>>=), (<$>), (<*>), (++), bind, const, id, pure, unit)

import Control.Apply ((*>))
import Control.Bind (join)
import Control.Monad.Eff (Eff(), foreachE)
import Control.Monad.Eff.Exception (Error(), error)

import Data.Array ((!!))
import Data.Bifunctor (lmap)
import Data.Either (Either(..), either)
import Data.Foreign.Class (read)
import Data.Function (Fn2(), mkFn2)
import Data.Maybe (Maybe(..), maybe)
import Data.Nullable (toMaybe)
import Data.String.Regex (Regex(), match, noFlags, regex)

import Unsafe.Coerce (unsafeCoerce)

import PursLoader.LoaderRef
  ( AsyncCallback()
  , LoaderRef()
  , Loader()
  , async
  , cacheable
  , query
  , clearDependencies
  , addDependency
  , resourcePath
  )

import PursLoader.Debug (debug)
import PursLoader.LoaderUtil (parseQuery)
import PursLoader.Options (Options(..))
import PursLoader.Path (dirname, relative)
import PursLoader.Plugin as Plugin

type Effects eff = (loader :: Loader | eff)

loader :: forall eff. LoaderRef -> String -> Eff (Effects eff) Unit
loader ref source = do
  callback <- async ref

  cacheable ref

  debug "Invoke PureScript plugin compilation"

  pluginContext.compile (compile callback)
  where
  pluginContext :: Plugin.Context (Effects eff)
  pluginContext = (unsafeCoerce ref).purescriptWebpackPluginContext

  compile :: AsyncCallback eff -> Plugin.Compile (Effects eff)
  compile callback error' { srcMap, ffiMap, graph } = do
    clearDependencies ref

    either (const $ pure unit) (\a -> debug ("Adding PureScript dependency " ++ a)) name

    addDependency ref (resourcePath ref)

    either (\err -> callback (Just err) "") id
           (handle <$> name <*> dependencies <*> exports)
    where
    handle :: String -> Array String -> String -> Eff (Effects eff) Unit
    handle name' deps res = do
      debug ("Adding PureScript transitive dependencies for " ++ name')
      addTransitive name'
      foreachE deps addTransitive
      callback (toMaybe error') res

    exports :: Either Error String
    exports = (\a b -> "module.exports = require('" ++ a ++ "')['" ++ b ++ "'];") <$> path <*> name

    dependencies :: Either Error (Array String)
    dependencies = name >>= Plugin.dependenciesOf graph

    addTransitive :: String -> Eff (Effects eff) Unit
    addTransitive dep = addDep (Plugin.get srcMap dep) *> addDep (Plugin.get ffiMap dep)
      where
      addDep :: Maybe String -> Eff (Effects eff) Unit
      addDep = maybe (pure unit) (addDependency ref)

    name :: Either Error String
    name =
      maybe (Left $ error "Failed to parse module name") Right
            (join $ match re source >>= \as -> as !! 1)
      where
      re :: Regex
      re = regex "(?:^|\\n)module\\s+([\\w\\.]+)" noFlags { ignoreCase = true }

    path :: Either Error String
    path = (\(Options opts) -> relative resourceDir opts.bundleOutput) <$> options
      where
      options :: Either Error Options
      options =
        lmap (const $ error "Failed to parse loader query")
             (read $ parseQuery (query ref))

      resourceDir :: String
      resourceDir = dirname (resourcePath ref)

loaderFn :: forall eff. Fn2 LoaderRef String (Eff (Effects eff) Unit)
loaderFn = mkFn2 loader
