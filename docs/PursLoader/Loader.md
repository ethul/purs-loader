## Module PursLoader.Loader

#### `Effects`

``` purescript
type Effects eff = (console :: CONSOLE, err :: EXCEPTION | eff)
```

#### `Effects_`

``` purescript
type Effects_ eff = Effects (loader :: Loader | eff)
```

#### `loader`

``` purescript
loader :: forall eff. LoaderRef -> String -> Eff (Effects_ eff) Unit
```

#### `loaderFn`

``` purescript
loaderFn :: forall eff. Fn2 LoaderRef String (Eff (Effects_ eff) Unit)
```


