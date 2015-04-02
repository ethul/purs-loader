'use strict';

var os = require('os');

var cp = require('child_process');

var path = require('path')

var fs = require('fs');

var glob = require('glob');

var lodash = require('lodash');

var chalk = require('chalk');

var lu = require('loader-utils');

var cwd = process.cwd();

var MODULE_RE = /(?:^|\n)module\s+([\w\.]+)/i;

var IMPORT_RE = /^\s*import\s+(?:qualified\s+)?([\w\.]+)/i;

var BOWER_PATTERN = path.join('bower_components', 'purescript-*', 'src');

var PSC_MAKE = 'psc-make';

var OUTPUT = 'output';

var OPTIONS = {
  'no-prelude': '--no-prelude',
  'no-opts': '--no-opts',
  'no-magic-do': '--no-magic-do',
  'no-tco': '--no-tco',
  'verbose-errors': '--verbose-errors',
  'output': '--output'
};

function pattern(root) {
  var as = [ BOWER_PATTERN, root ];
  return path.join('{' + as.join(',') + '}', '**', '*.purs');
}

function mkOptions(query) {
  return lodash.foldl(lodash.keys(query), function(acc, k){
    var h = function(v){return acc.concat(query[k] && OPTIONS[k] ? [v] : []);}
    if (k === OUTPUT) return h(OPTIONS[k] + '=' + query[k]);
    else return h(OPTIONS[k]);
  }, []);
}

function mkGraph(files) {
  var graph = {};

  files.forEach(function(file){
    var source = fs.readFileSync(file, {encoding: 'utf-8'});

    var result = MODULE_RE.exec(source);

    var module = result ? result[1] : null;

    var imports =
      lodash.foldl(source.split(os.EOL), function(b, a){
        var result = IMPORT_RE.exec(a);
        if (result) b.push(result[1]);
        return b;
      }, [])
    ;

    if (module) {
      graph[module] = {
        file: file,
        imports: imports || []
      };
    }
  });

  return graph;
}

function findDeps(graph, module) {
  function go(acc, module){
    var node = graph[module];

    var imports = node && node.imports;

    if (lodash.isEmpty(imports)) return acc;
    else {
      var deps =
        lodash.map(imports, function(i){
          return go(acc.concat(imports), i);
        })
      ;
      return lodash.flatten(deps);
    }
  }

  return lodash.unique(go([], module));
}

function loader(source) {
  this.cacheable && this.cacheable();

  this.clearDependencies();

  this.addDependency(this.resourcePath);

  var callback = this.async();

  var request = lu.getRemainingRequest(this)

  var root = path.dirname(path.relative(cwd, request));

  var query = lu.parseQuery(this.query);

  var opts = mkOptions(query);

  var that = this;

  glob(pattern(root), function(e, files){
    if (e !== null) callback(e);
    else {
      var cmd = cp.spawn(PSC_MAKE, opts.concat(files));

      var graph = mkGraph(files);

      cmd.on('close', function(e){
        if (e) callback(e);
        else {
          var result = MODULE_RE.exec(source);

          var module = result ? result[1] : '';

          var dependencies = findDeps(graph, module);

          var indexPath = path.join(query[OUTPUT] || OUTPUT, module, 'index.js');

          fs.readFile(indexPath, 'utf-8', function(e, output){
            if (e) callback(e);
            else {
              dependencies.forEach(function(dep){
                var module = graph[dep];
                if (module) that.addDependency(path.resolve(module.file));
              });

              callback(null, output);
            }
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
}

module.exports = loader;
