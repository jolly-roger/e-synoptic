'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');
var clean = require('gulp-clean');
var less = require('gulp-less');
var browserify = require('gulp-browserify');
var path = require('path');


gulp.task('babel', ['clear'], function () {
    return gulp.src('src/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('build/es5'));
});

gulp.task('views', ['clear'], function () {
    return gulp.src('src/**/*.html')
        .pipe(gulp.dest('build'));
});

gulp.task('less', ['clear'], function () {
    return gulp.src('./src/index.less')
        .pipe(less())
        .pipe(gulp.dest('./build'));
});

gulp.task('data', ['clear'], function () {
    return gulp.src('data/**/*.json')
        .pipe(gulp.dest('build/data'));
});

gulp.task('browserify', ['babel'], function () {
    return gulp.src('build/es5/index.js')
        .pipe(browserify({
            basedir: './build/es5/'
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('clear', function () {
    return gulp.src('build/*', {read: false})
        .pipe(clean());
});

gulp.task('default', ['clear', 'babel', 'browserify', 'views', 'less', 'data']);