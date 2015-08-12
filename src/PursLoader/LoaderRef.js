'use strict';

// module PursLoader.LoaderRef

function asyncFn(isJust, fromMaybe, ref){
  return function(){
    var callback = ref.async();
    return function(error){
      return function(value){
        return function(){
          return isJust(error) ? callback(fromMaybe(new Error())(error))
                               : callback(null, value);
        };
      };
    };
  };
}
function cacheable(ref){
  return function(){
    return ref.cacheable && ref.cacheable();
  };
}

function query(ref){
  return ref.query;
}

function clearDependencies(ref){
  return function(){
    return ref.clearDependencies();
  };
}

function resourcePath(ref){
  return ref.resourcePath;
}

function addDependency(ref){
  return function(dep){
    return function(){
      return ref.addDependency(dep);
    };
  };
}

exports.asyncFn = asyncFn;

exports.cacheable = cacheable;

exports.query = query;

exports.clearDependencies = clearDependencies;

exports.resourcePath = resourcePath;

exports.addDependency = addDependency;
