var Prelude = require('Prelude');

var test = require('./Test.purs');

var foo = require('./Foo.purs');

var baz = require('./Foo/Baz.purs');

var bar = require('./Foo/Bar.purs');

console.log(Prelude, test, foo, baz, bar);
