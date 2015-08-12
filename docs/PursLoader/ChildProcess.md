## Module PursLoader.ChildProcess

#### `ChildProcess`

``` purescript
data ChildProcess :: !
```

#### `spawn`

``` purescript
spawn :: forall eff. String -> Array String -> Aff (cp :: ChildProcess | eff) String
```


