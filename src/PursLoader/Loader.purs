module PursLoader.Loader
  ( Effects()
  , loader
  , loaderFn
  ) where

import Prelude (Unit(), ($), (>>=), (<$>), (<*>), (<<<), (++), bind, const)

import Control.Bind (join)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Exception (Error(), error)

import Data.Array ((!!))
import Data.Function (Fn2(), mkFn2)
import Data.Maybe (Maybe(..), maybe)
import Data.Either (either)
import Data.Foreign (Foreign())
import Data.Foreign.Class (read)
import Data.Foreign.Null (runNull)
import Data.String.Regex (Regex(), match, noFlags, regex)

import Unsafe.Coerce (unsafeCoerce)

import PursLoader.LoaderRef
  ( LoaderRef()
  , Loader()
  , async
  , cacheable
  , query
  , clearDependencies
  , addDependency
  , resourcePath
  )

import PursLoader.LoaderUtil (parseQuery)
import PursLoader.Options (runOptions)
import PursLoader.Path (dirname, relative)

type Effects eff = (loader :: Loader | eff)

type PurescriptWebpackPluginContext eff = { compile :: (Foreign -> Eff (Effects eff) Unit) -> Eff (Effects eff) Unit }

loader :: forall eff. LoaderRef -> String -> Eff (Effects eff) Unit
loader ref source = do
  callback <- async ref

  cacheable ref

  let parsed = parseQuery $ query ref

      options = either (const Nothing) (Just <<< runOptions) (read parsed)

      moduleName = join $ match moduleRegex source >>= \as -> as !! 1

      resourceDir = dirname (resourcePath ref)

      modulePath = (\opts -> relative resourceDir opts.pscBundle) <$> options

      result = (\path name -> "module.exports = require('" ++ path ++ "')['" ++ name ++ "'];") <$> modulePath <*> moduleName

  clearDependencies ref

  addDependency ref (resourcePath ref)

  pluginContext.compile (\err -> maybe (callback (Just $ error "Failed to run loader") "")
                                       (callback (compileError err)) result)
  where
  moduleRegex :: Regex
  moduleRegex = regex "(?:^|\\n)module\\s+([\\w\\.]+)" noFlags { ignoreCase = true }

  pluginContext :: PurescriptWebpackPluginContext eff
  pluginContext = (unsafeCoerce ref).purescriptWebpackPluginContext

  compileError :: Foreign -> Maybe Error
  compileError value = either (const $ Just (error "Failed to compile")) ((<$>) error) (runNull <$> read value)

loaderFn :: forall eff. Fn2 LoaderRef String (Eff (Effects eff) Unit)
loaderFn = mkFn2 loader
