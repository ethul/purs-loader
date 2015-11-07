var path = require('path');

var srcs = ['src[]=bower_components/purescript-*/src/**/*.purs', 'src[]=src/**/*.purs'];

var ffis = ['ffi[]=bower_components/purescript-*/src/**/*.js', 'ffi[]=src/**/*FFI.js'];

var output = 'output';

var modulesDirectories = [
  'node_modules',
  'bower_components/purescript-prelude/src'
];

var config
  = { entry: './src/entry'
    , output: { path: __dirname
              , pathinfo: true
              , filename: 'bundle.js'
              }
    , module: { loaders: [ { test: /\.purs$/
                           , loader: 'purs-loader?output=' + output + '&' + srcs.concat(ffis).join('&')
                           } ] }
    , resolve: { modulesDirectories: modulesDirectories
               , extensions: ['', '.js']
               }
    , resolveLoader: { root: path.join(__dirname, 'node_modules') }
    }
    ;

module.exports = config;
