"use strict"

const dargs = require("dargs")

module.exports = function(obj) {
  return dargs(obj, { ignoreFalse: true })
}
