var Prelude = require('purescript-prelude/src/Prelude');

var test = require('./Test');

var foo = require('./Foo.purs');

var baz = require('./Foo/Baz');

var jam = require('./jam');

console.log(Prelude, test, foo, baz, jam);
