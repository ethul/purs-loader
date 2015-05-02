module PursLoader.Loader
  ( LoaderEff()
  , loader
  , loaderFn
  ) where

import Control.Monad.Aff (Aff(), runAff)
import Control.Monad.Eff (Eff())
import Control.Monad.Eff.Class (liftEff)
import Control.Monad.Eff.Exception (error)

import Data.Array ((!!), catMaybes, concat, filter, null)
import Data.Foldable (foldl)
import Data.Function (Fn2(), mkFn2)
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.Set (Set(), empty, insert, member, toList, unions)
import Data.String (joinWith, split)
import Data.String.Regex (Regex(), match, noFlags, regex)
import Data.StrMap (StrMap(), fromList, lookup)
import Data.Traversable (sequence)
import Data.Tuple.Nested (tuple2)

import PursLoader.ChildProcess (ChildProcess(), spawn)
import PursLoader.FS (FS(), readFileUtf8, readFileUtf8Sync)
import PursLoader.Glob (Glob(), glob)
import PursLoader.LoaderRef (LoaderRef(), Loader(), async, cacheable, clearDependencies, addDependency, query, resourcePath)
import PursLoader.LoaderUtil (getRemainingRequest, parseQuery)
import PursLoader.OS (eol)
import PursLoader.Options (pscMakeOptions, pscMakeDefaultOutput, pscMakeOutputOption)
import PursLoader.Path (dirname, join, relative, resolve)

foreign import cwd "var cwd = process.cwd();" :: String

moduleRegex = regex "(?:^|\\n)module\\s+([\\w\\.]+)" noFlags { ignoreCase = true }

importRegex = regex "^\\s*import\\s+(?:qualified\\s+)?([\\w\\.]+)" noFlags { ignoreCase = true }

bowerPattern = join [ "bower_components", "purescript-*", "src" ]

pscMakeCommand = "psc-make"

indexFilename = "index.js"

(!!!) = flip (!!)

pursPattern :: String -> String
pursPattern root = join [ "{" ++ joinWith "," [ bowerPattern, root ] ++ "}"
                        , "**"
                        , "*.purs"
                        ]

type GraphModule = { file :: String, imports :: [String] }

type Graph = StrMap GraphModule

mkGraph :: forall eff. [String] -> Eff (fs :: FS | eff) Graph
mkGraph files = (fromList <<< catMaybes) <$> sequence (parse <$> files)
  where parse file = do source <- readFileUtf8Sync file
                        let key = match moduleRegex source >>= (!!!) 1
                            lines = split eol source
                            imports = catMaybes $ (\a -> match importRegex a >>= (!!!) 1) <$> lines
                        return $ (\a -> tuple2 a { file: file, imports: imports }) <$> key

mkDeps :: forall eff. String -> Graph -> [String]
mkDeps key graph = toList $ go empty key
  where
    go :: Set String -> String -> Set String
    go acc key =
      let node = fromMaybe {file: "", imports: []} (lookup key graph)
          uniq = filter (not <<< flip member acc) node.imports
          acc' = foldl (flip insert) acc node.imports
       in if null uniq
             then acc'
             else unions $ go acc' <$> uniq

addDeps :: forall eff. LoaderRef -> Graph -> [String] -> Eff (loader :: Loader | eff) Unit
addDeps ref graph deps = const unit <$> (sequence $ add <$> deps)
  where add dep = let res = lookup dep graph
                      path = (\a -> resolve a.file) <$> res
                   in maybe (pure unit) (addDependency ref) path

type LoaderAff eff a = Aff (loader :: Loader, glob :: Glob, cp :: ChildProcess, fs :: FS | eff) a

loader' :: forall eff. LoaderRef -> String -> LoaderAff eff (Maybe String)
loader' ref source = do
  liftEff $ cacheable ref

  let request = getRemainingRequest ref
      root = dirname $ relative cwd request
      parsed = parseQuery $ query ref
      opts = pscMakeOptions parsed
      pattern = pursPattern root
      key = match moduleRegex source >>= (!!!) 1

  files <- glob pattern
  graph <- liftEff $ mkGraph files

  let deps = fromMaybe [] $ flip mkDeps graph <$> key
      outputPath = fromMaybe pscMakeDefaultOutput $ pscMakeOutputOption parsed
      indexPath = (\a -> join [ outputPath, a, indexFilename ]) <$> key

  liftEff $ clearDependencies ref
  liftEff $ addDependency ref (resourcePath ref)
  liftEff $ addDeps ref graph deps

  spawn pscMakeCommand (opts <> files)
  indexFile <- sequence $ readFileUtf8 <$> indexPath
  return indexFile

type LoaderEff eff a = Eff (loader :: Loader, glob :: Glob, cp :: ChildProcess, fs :: FS | eff) a

loader :: forall eff. LoaderRef -> String -> LoaderEff eff Unit
loader ref source = do
  callback <- async ref
  runAff (\e -> callback (Just e) "")
         (maybe (callback (Just $ error "Loader has failed to run") "")
                (callback Nothing))
         (loader' ref source)

loaderFn :: forall eff. Fn2 LoaderRef String (LoaderEff eff Unit)
loaderFn = mkFn2 loader
