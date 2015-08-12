## Module PursLoader.FS

#### `FS`

``` purescript
data FS :: !
```

#### `writeFileUtf8`

``` purescript
writeFileUtf8 :: forall eff. String -> String -> Aff (fs :: FS | eff) Unit
```

#### `findFileUtf8`

``` purescript
findFileUtf8 :: forall eff. Regex -> Array String -> Aff (fs :: FS | eff) (Maybe String)
```


