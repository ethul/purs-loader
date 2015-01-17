var test = require('purs?output=output!./Test.purs');

var foo = require('purs?output=output!./Foo.purs');

var baz = require('purs?output=output!./Foo/Baz.purs');

console.log(test, foo, baz);
