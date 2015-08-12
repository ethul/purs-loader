## Module PursLoader.Loader

#### `Effects`

``` purescript
type Effects eff = (cp :: ChildProcess, fs :: FS, glob :: Glob, loader :: Loader | eff)
```

#### `loader`

``` purescript
loader :: forall eff. LoaderRef -> String -> Eff (Effects eff) Unit
```

#### `loaderFn`

``` purescript
loaderFn :: forall eff. Fn2 LoaderRef String (Eff (Effects eff) Unit)
```


