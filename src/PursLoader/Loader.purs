module PursLoader.Loader
  ( Effects()
  , Effects_()
  , loader
  , loaderFn
  ) where

import Prelude (Unit(), ($), (>>=), (<$>), (<*>), (++), bind, const, id, pure, void, unit)

import Control.Apply ((*>))
import Control.Bind (join)
import Control.Monad.Eff (Eff(), foreachE)
import Control.Monad.Eff.Console (CONSOLE())
import Control.Monad.Eff.Exception (EXCEPTION(), Error(), error, message)

import Data.Array ((!!))
import Data.Bifunctor (lmap)
import Data.Either (Either(..), either)
import Data.Foreign.Class (read)
import Data.Function (Fn2(), mkFn2)
import Data.Maybe (Maybe(), maybe)
import Data.Nullable (toMaybe)
import Data.String.Regex (Regex(), match, noFlags, regex)

import Node.Encoding (Encoding(UTF8))
import Node.Process (stderr)
import Node.Stream (writeString)

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

type Effects eff = (console :: CONSOLE, err :: EXCEPTION | eff)

type Effects_ eff = Effects (loader :: Loader | eff)

loader :: forall eff. LoaderRef -> String -> Eff (Effects_ eff) Unit
loader ref source = do
  callback <- async ref

  cacheable ref

  debug "Invoke PureScript plugin compilation"

  pluginContext.compile (compile callback)
  where
  pluginContext :: Plugin.Context (Effects_ eff)
  pluginContext = (unsafeCoerce ref).purescriptWebpackPluginContext

  compile :: AsyncCallback (Effects eff) -> Plugin.Compile (Effects_ eff)
  compile callback error' { srcMap, ffiMap, graph, output } = do
    clearDependencies ref

    either (const $ pure unit) (\a -> debug ("Adding PureScript dependency " ++ a)) name

    addDependency ref (resourcePath ref)

    void $ writeString stderr UTF8 output (pure unit)

    maybe (pure unit) (\a -> void $ writeString stderr UTF8 (message a) (pure unit)) (toMaybe error')

    either (const $ callback (pure fixedError) "") id
           (handle <$> name <*> dependencies <*> exports)
    where
    fixedError :: Error
    fixedError = error "PureScript compilation has failed."

    handle :: String -> Array String -> String -> Eff (Effects_ eff) Unit
    handle name' deps res = do
      debug ("Adding PureScript transitive dependencies for " ++ name')
      addTransitive name'
      foreachE deps addTransitive
      debug "Generated loader result"
      debug res
      callback (const fixedError <$> toMaybe error') res

    exports :: Either Error String
    exports = (\a b -> "module.exports = require('" ++ a ++ "')['" ++ b ++ "'];") <$> path <*> name

    dependencies :: Either Error (Array String)
    dependencies = name >>= Plugin.dependenciesOf graph

    addTransitive :: String -> Eff (Effects_ eff) Unit
    addTransitive dep = addDep (Plugin.get srcMap dep) *> addDep (Plugin.get ffiMap dep)
      where
      addDep :: Maybe String -> Eff (Effects_ eff) Unit
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

loaderFn :: forall eff. Fn2 LoaderRef String (Eff (Effects_ eff) Unit)
loaderFn = mkFn2 loader
