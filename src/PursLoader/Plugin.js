'use strict';

// module PursLoader.Plugin

function getFn(nothing, just, map, key) {
  var value = map.get(key);
  return value === undefined ? nothing : just(value);
}
exports.getFn = getFn;

function dependenciesOfFn(left, right, graph, node) {
  try {
    var dependencies = graph.dependenciesOf(node);
    return right(dependencies);
  }
  catch (error) {
    return left(error);
  }
}
exports.dependenciesOfFn = dependenciesOfFn;
