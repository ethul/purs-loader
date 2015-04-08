module PursLoader.OS (eol) where

foreign import eol "var eol = require('os').EOL;" :: String
