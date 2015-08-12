'use strict'

// module PursLoader.Loader

var path = require('path');

var cwd = process.cwd();

function relative(from) {
  return function(to){
    return path.relative(from, to);
  };
}

exports.cwd = cwd;

exports.relative = relative;

exports.resolve = path.resolve;
