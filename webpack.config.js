'use strict';

var path = require('path');

var webpack = require('webpack');

var noErrorsPlugin = webpack.NoErrorsPlugin;

var dedupePlugin = webpack.optimize.DedupePlugin;

var config
  = { cache: true
    , target: 'node'
    , entry: { index: './entry' }
    , externals: { 'glob': 'commonjs glob'
                 , 'loader-utils': 'commonjs loader-utils'
                 }
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
