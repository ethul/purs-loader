'use strict';

// module PursLoader.Glob

var glob = require('glob');

var async = require('async');

function globAllFn(patterns, errback, callback) {
  return function(){
    async.map(patterns, glob, function(error, result){
      if (error) errback(new Error(error))();
      else callback(result)();
    });
  };
}

exports.globAllFn = globAllFn;
