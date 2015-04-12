'use strict';

var path = require('path');

var gulp = require('gulp');

var gutil = require('gulp-util');

var plumber = require('gulp-plumber');

var purescript = require('gulp-purescript');

var sequence = require('run-sequence');

var del = require('del');

var config = { del: ['build', 'index.js']
             , purescript: { src: [ 'bower_components/purescript-*/src/**/*.purs*'
                                  , 'src/**/*.purs'
                                  ]
                           , dest: 'build'
                           , docs: 'MODULE.md'
                           }
             }
             ;

function error(e) {
  gutil.log(gutil.colors.magenta('>>>> Error <<<<') + '\n' + e.toString().trim());
  this.emit('end');
}

gulp.task('del', function(cb){
  del(config.del, cb);
});

gulp.task('make', function(){
  return gulp.src(config.purescript.src).
         pipe(plumber()).
         pipe(purescript.pscMake({output: config.purescript.dest})).
         on('error', error);
});

gulp.task('psci', function(){
  return gulp.src(config.purescript.src).
         pipe(plumber()).
         pipe(purescript.dotPsci()).
         on('error', error);
});

gulp.task('docs', function(){
  return gulp.src(config.purescript.src[1]).
         pipe(plumber()).
         pipe(purescript.pscDocs()).
         on('error', error).
         pipe(gulp.dest(config.purescript.docs));
});

gulp.task('watch', function(){
  gulp.watch(config.purescript.src, ['make']);
});

gulp.task('default', function(callback){
  sequence('del', 'make', ['psci', 'docs'], callback);
});

gulp.task('build', function(callback){
  sequence('del', 'make', callback);
});
