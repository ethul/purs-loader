## Module PursLoader.LoaderRef

#### `AsyncCallback`

``` purescript
type AsyncCallback eff = Maybe Error -> String -> Eff (loader :: Loader | eff) Unit
```

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
async :: forall eff. LoaderRef -> Eff (loader :: Loader | eff) (Maybe Error -> String -> Eff (loader :: Loader | eff) Unit)
```

#### `cacheable`

``` purescript
cacheable :: forall eff. LoaderRef -> Eff (loader :: Loader | eff) Unit
```

#### `query`

``` purescript
query :: LoaderRef -> String
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


