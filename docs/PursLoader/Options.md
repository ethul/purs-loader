## Module PursLoader.Options

#### `Options`

``` purescript
newtype Options
```

##### Instances
``` purescript
instance isForeignOptions :: IsForeign Options
```

#### `output`

``` purescript
output :: Options -> String
```

#### `pscOptions`

``` purescript
pscOptions :: Options -> Array String
```

#### `loaderSrcOption`

``` purescript
loaderSrcOption :: Foreign -> Maybe (Array String)
```

#### `loaderFFIOption`

``` purescript
loaderFFIOption :: Foreign -> Maybe (Array String)
```


