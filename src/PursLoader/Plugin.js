'use strict';

// module PursLoader.Plugin

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
