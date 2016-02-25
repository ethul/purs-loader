module Foo where

import Prelude

import qualified Foo.Bar as B

foo = "A"

bar = "B"

jaz = "D" ++ B.jar ++ B.jee

foreign import foot :: String

foreign import meter :: String
