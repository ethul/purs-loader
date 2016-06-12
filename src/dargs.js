'use strict';

function dargs(obj) {
  return Object.keys(obj).reduce((args, key) => {
    const arg = '--' + key.replace(/[A-Z]/g, '-$&').toLowerCase();
    const val = obj[key]

    if (key === '_') val.forEach(v => args.push(v))
    else if (Array.isArray(val)) val.forEach(v => args.push(arg, v))
    else args.push(arg, obj[key])

    return args.filter(arg => (typeof arg !== 'boolean'))
  }, [])
}

module.exports = dargs;
