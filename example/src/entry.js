var Prelude = require('purescript-prelude/src/Prelude.purs');

var test = require('./Test.purs');

var foo = require('./Foo.purs');

var baz = require('./Foo/Baz.purs');

console.log(Prelude, test, foo, baz);
