'use strict'

// module PursLoader.Loader

var path = require('path');

var cwd = process.cwd();

function relative(from) {
  return function(to){
    return path.relative(from, to);
  };
}

function joinPath(a) {
  return function(b) {
    return path.join(a, b);
  };
}

exports.cwd = cwd;

exports.relative = relative;

exports.joinPath = joinPath;

exports.resolve = path.resolve;

exports.dirname = path.dirname;
