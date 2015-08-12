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


