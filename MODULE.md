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


#### `writeFileUtf8`

``` purescript
writeFileUtf8 :: forall eff. String -> String -> Aff (fs :: FS | eff) Unit
```



## Module PursLoader.Glob

#### `Glob`

``` purescript
data Glob :: !
```


#### `globAll`

``` purescript
globAll :: forall eff. [String] -> Aff (glob :: Glob | eff) [[String]]
```



## Module PursLoader.Loader

#### `Effects`

``` purescript
type Effects eff = (loader :: Loader, glob :: Glob, fs :: FS, cp :: ChildProcess | eff)
```


#### `loader`

``` purescript
loader :: forall eff. LoaderRef -> String -> Eff (Effects eff) Unit
```


#### `loaderFn`

``` purescript
loaderFn :: forall eff. Fn2 LoaderRef String (Eff (Effects eff) Unit)
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


#### `query`

``` purescript
query :: LoaderRef -> String
```



## Module PursLoader.LoaderUtil

#### `parseQuery`

``` purescript
parseQuery :: String -> Foreign
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


#### `arrayLoaderOption`

``` purescript
instance arrayLoaderOption :: (LoaderOption a) => LoaderOption [a]
```


#### `pscOptions`

``` purescript
pscOptions :: Foreign -> [String]
```


#### `loaderSrcOption`

``` purescript
loaderSrcOption :: Foreign -> Maybe [String]
```


#### `loaderFFIOption`

``` purescript
loaderFFIOption :: Foreign -> Maybe [String]
```




