## Module PursLoader.Plugin

#### `Result`

``` purescript
type Result = { srcMap :: ImmutableMap String String, ffiMap :: ImmutableMap String String, graph :: DependencyGraph, output :: String }
```

#### `Compile`

``` purescript
type Compile eff = Nullable Error -> Result -> Eff eff Unit
```

#### `Context`

``` purescript
type Context eff = { compile :: Compile eff -> Eff eff Unit }
```

#### `get`

``` purescript
get :: forall key value. ImmutableMap key value -> key -> Maybe value
```

#### `dependenciesOf`

``` purescript
dependenciesOf :: DependencyGraph -> String -> Either Error (Array String)
```

#### `ImmutableMap`

``` purescript
data ImmutableMap :: * -> * -> *
```

#### `DependencyGraph`

``` purescript
data DependencyGraph :: *
```


