## Module PursLoader.Plugin

#### `Compile`

``` purescript
type Compile eff = Nullable Error -> DependencyGraph -> String -> Eff eff Unit
```

#### `Context`

``` purescript
type Context eff = { compile :: Compile eff -> Eff eff Unit, options :: Options }
```

#### `Options`

``` purescript
type Options = { bundle :: Boolean, output :: String, bundleOutput :: String }
```

#### `dependenciesOf`

``` purescript
dependenciesOf :: DependencyGraph -> String -> Either Error (Array String)
```

#### `DependencyGraph`

``` purescript
data DependencyGraph :: *
```


