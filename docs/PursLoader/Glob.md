## Module PursLoader.Glob

#### `Glob`

``` purescript
data Glob :: !
```

#### `globAll`

``` purescript
globAll :: forall eff. Array String -> Aff (glob :: Glob | eff) (Array (Array String))
```


