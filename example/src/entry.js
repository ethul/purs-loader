var Prelude = require('Prelude');

var test = require('./Test');

var foo = require('./Foo');

var baz = require('./Foo/Baz');

var bar = require('./Foo/Bar');

console.log(Prelude, test, foo, baz, bar);
