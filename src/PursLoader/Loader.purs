module PursLoader.Loader
  ( Effects()
  , loader
  , loaderFn
  ) where

import Prelude (Unit(), ($), (>>=), (<$>), (<*>), (++), (<<<), bind, const, id, pure, unit)

import Control.Apply ((*>))
import Control.Alt ((<|>))
import Control.Bind (join)
import Control.Monad.Eff (Eff(), foreachE)
import Control.Monad.Eff.Exception (Error(), error)

import Data.Array ((!!))
import Data.Either (Either(..), either)
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
  , clearDependencies
  , addDependency
  , resourcePath
  )

import PursLoader.Debug (debug)
import PursLoader.Path (dirname, joinPath, relative)
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

    either (\err -> callback (toMaybe error' <|> Just err) "") id
           (handle <$> name <*> dependencies <*> exports)
    where
    handle :: String -> Array String -> String -> Eff (Effects eff) Unit
    handle name' deps res = do
      debug ("Adding PureScript transitive dependencies for " ++ name')
      addTransitive name'
      foreachE deps addTransitive
      debug "Generated loader result"
      debug res
      callback (toMaybe error') res

    exports :: Either Error String
    exports =
      if pluginContext.options.bundle
         then bundleExport <$> name
         else moduleExport <<< modulePath <$> name
      where
      bundleExport :: String -> String
      bundleExport name' = "module.exports = require('" ++ path ++ "')['" ++ name' ++ "'];"
        where
        path :: String
        path = relative resourceDir pluginContext.options.bundleOutput

      moduleExport :: String -> String
      moduleExport path = "module.exports = require('" ++ path ++ "');"

      modulePath :: String -> String
      modulePath = relative resourceDir <<< joinPath pluginContext.options.output

      resourceDir :: String
      resourceDir = dirname (resourcePath ref)

    dependencies :: Either Error (Array String)
    dependencies =
      if pluginContext.options.bundle
         then name >>= Plugin.dependenciesOf graph
         else pure []

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

loaderFn :: forall eff. Fn2 LoaderRef String (Eff (Effects eff) Unit)
loaderFn = mkFn2 loader
