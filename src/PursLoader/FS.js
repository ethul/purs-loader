'use strict';

// module PursLoader.FS

var fs = require('fs');

var async = require('async');

function writeFileUtf8Fn(filepath, contents, errback, callback) {
  return function(){
    fs.writeFile(filepath, contents, function(error){
      if (error) errback(error)();
      else callback()();
    });
  };
}

function findFileUtf8Fn(nothing, just, regex, filepaths, errback, callback) {
  return function(){
    function findFile(filepath, callback) {
      fs.readFile(filepath, {encoding: 'utf-8'}, function(error, result){
        if (error) callback(false);
        else callback(regex.test(result));
      });
    }

    async.detect(filepaths, findFile, function(result){
      if (!result) callback(nothing)();
      else callback(just(result))();
    });
  };
}

exports.writeFileUtf8Fn = writeFileUtf8Fn;

exports.findFileUtf8Fn = findFileUtf8Fn;
