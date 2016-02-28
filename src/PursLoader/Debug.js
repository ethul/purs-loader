'use strict';

// module PursLoader.Debug

var debug_ = require('debug')('purs-loader');

function debug(message) {
  return function(){
    debug_(message);
  };
}
exports.debug = debug;
