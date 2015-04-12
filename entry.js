'use strict';

var pursLoader = require('PursLoader.Loader');

function loader(source) {
  var ref = this;
  var result = pursLoader.loaderFn(ref, source);
  return result();
}

module.exports = loader;
