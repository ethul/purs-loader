'use strict'

// module PursLoader.Path

var path = require('path');

function relative(from) {
  return function(to){
    return path.relative(from, to);
  };
}
exports.relative = relative;


function joinPath(a) {
  return function(b) {
    return path.join(a, b);
  };
}
exports.joinPath = joinPath;

exports.resolve = path.resolve;

exports.dirname = path.dirname;
