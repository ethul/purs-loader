'use strict';

var path = require('path');

var webpack = require('webpack');

var packageJson = require('./package.json');

var noErrorsPlugin = webpack.NoErrorsPlugin;

var dedupePlugin = webpack.optimize.DedupePlugin;

var config
  = { cache: true
    , target: 'node'
    , entry: { index: './entry' }
    , externals: Object.keys(packageJson.dependencies).reduce(function(b, a){
                   b[a] = 'commonjs ' + a;
                   return b;
                 }, {})
    , output: { path: __dirname
              , filename: '[name].js'
              , libraryTarget: 'commonjs2'
              }
    , plugins: [ new noErrorsPlugin()
               , new dedupePlugin()
               ]
    , resolve: { modulesDirectories: [ 'build' ] }
    }
    ;

module.exports = config;
