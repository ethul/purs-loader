var cp = require('child_process')
  , path = require('path')
  , fs = require('fs')
  , glob = require('glob')
  , lodash = require('lodash')
  , chalk = require('chalk')
  , lu = require('loader-utils')
  , cwd = process.cwd()
  , PSC_MAKE = 'psc-make'
  , OUTPUT = 'output'
  , OPTIONS = {
      'no-prelude': '--no-prelude',
      'no-opts': '--no-opts',
      'no-magic-do': '--no-magic-do',
      'no-tco': '--no-tco',
      'verbose-errors': '--verbose-errors',
      'output': '--output'
    }
;

module.exports = function(source){
  var callback = this.async()
    , request = lu.getRemainingRequest(this)
    , root = path.dirname(path.relative(cwd, request))
    , query = lu.parseQuery(this.query)
    , opts = lodash.foldl(lodash.keys(query), function(acc, k){
        var h = function(v){return acc.concat(query[k] && OPTIONS[k] ? [v] : []);}
        if (k === OUTPUT) return h(OPTIONS[k] + '=' + query[k]);
        else return h(OPTIONS[k]);
      }, [])
  ;
  glob(path.join(root, '**', '*.purs'), function(e, files){
    if (e !== null) callback(e);
    else {
      var cmd = cp.spawn(PSC_MAKE, opts.concat(files));
      cmd.on('close', function(e){
        if (e) callback(e);
        else {
          var module = path.basename(request, '.purs');
          fs.readFile(path.join(opts[OPTIONS[OUTPUT]] || OUTPUT, module, 'index.js'), 'utf-8', function(e, output){
            if (e) callback(e);
            else callback(e, output);
          });
        }
      });
      cmd.stdout.on('data', function(stdout){
        console.log('Stdout from \'' + chalk.cyan(PSC_MAKE) + '\'\n' + chalk.magenta(stdout));
      });
      cmd.stderr.on('data', function(stderr){
        console.log('Stderr from \'' + chalk.cyan(PSC_MAKE) + '\'\n' + chalk.magenta(stderr));
      });
    }
  });
};
