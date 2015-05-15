# Module Documentation

## Module PursLoader.ChildProcess

#### `ChildProcess`

``` purescript
data ChildProcess :: !
```


#### `spawn`

``` purescript
spawn :: forall eff. String -> [String] -> Aff (cp :: ChildProcess | eff) String
```



## Module PursLoader.FS

#### `FS`

``` purescript
data FS :: !
```


#### `readFileUtf8`

``` purescript
readFileUtf8 :: forall eff. String -> Aff (fs :: FS | eff) String
```


#### `readFileUtf8Sync`

``` purescript
readFileUtf8Sync :: forall eff. String -> Eff (fs :: FS | eff) String
```



## Module PursLoader.Glob

#### `Glob`

``` purescript
data Glob :: !
```


#### `glob`

``` purescript
glob :: forall eff. String -> Aff (glob :: Glob | eff) [String]
```



## Module PursLoader.Loader

#### `LoaderEff`

``` purescript
type LoaderEff eff a = Eff (fs :: FS, cp :: ChildProcess, glob :: Glob, loader :: Loader | eff) a
```


#### `loader`

``` purescript
loader :: forall eff. LoaderRef -> String -> LoaderEff eff Unit
```


#### `loaderFn`

``` purescript
loaderFn :: forall eff. Fn2 LoaderRef String (LoaderEff eff Unit)
```



## Module PursLoader.LoaderRef

#### `LoaderRef`

``` purescript
data LoaderRef
```


#### `Loader`

``` purescript
data Loader :: !
```


#### `async`

``` purescript
async :: forall eff a. LoaderRef -> Eff (loader :: Loader | eff) (Maybe Error -> a -> Eff (loader :: Loader | eff) Unit)
```


#### `cacheable`

``` purescript
cacheable :: forall eff. LoaderRef -> Eff (loader :: Loader | eff) Unit
```


#### `clearDependencies`

``` purescript
clearDependencies :: forall eff. LoaderRef -> Eff (loader :: Loader | eff) Unit
```


#### `resourcePath`

``` purescript
resourcePath :: LoaderRef -> String
```


#### `addDependency`

``` purescript
addDependency :: forall eff. LoaderRef -> String -> Eff (loader :: Loader | eff) Unit
```


#### `query`

``` purescript
query :: LoaderRef -> String
```



## Module PursLoader.LoaderUtil

#### `getRemainingRequest`

``` purescript
getRemainingRequest :: LoaderRef -> String
```


#### `parseQuery`

``` purescript
parseQuery :: String -> Foreign
```



## Module PursLoader.OS

#### `eol`

``` purescript
eol :: String
```



## Module PursLoader.Options

#### `isForeignOptions`

``` purescript
instance isForeignOptions :: IsForeign Options
```


#### `booleanLoaderOption`

``` purescript
instance booleanLoaderOption :: LoaderOption Boolean
```


#### `stringLoaderOption`

``` purescript
instance stringLoaderOption :: LoaderOption String
```


#### `pscMakeOutputOption`

``` purescript
pscMakeOutputOption :: Foreign -> Maybe String
```


#### `pscMakeOptions`

``` purescript
pscMakeOptions :: Foreign -> [String]
```


#### `loaderSrcOption`

``` purescript
loaderSrcOption :: Foreign -> Maybe [String]
```



## Module PursLoader.Path

#### `dirname`

``` purescript
dirname :: String -> String
```


#### `join`

``` purescript
join :: [String] -> String
```


#### `relative`

``` purescript
relative :: String -> String -> String
```


#### `resolve`

``` purescript
resolve :: String -> String
```




