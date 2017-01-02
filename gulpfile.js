
var gulp = require('gulp');
var sass = require('gulp-sass');
var watch = require("gulp-watch");
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('gulp-typescript');
var electron = require('electron-connect').server.create();

// TypeScript変換
gulp.task('ts', function()
{
	gulp.src(['./classes/*.ts', './main.ts'])
	.pipe(typescript({out: 'main.js'}))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('./'));
});

// Sass変換
gulp.task('sass', function()
{
	gulp.src('./scss/style.scss')
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./'));
});

gulp.task('electron', ['ts', 'sass'], function()
{
	// electron.restart();
	electron.start();
});

// 
gulp.task('watch', function()
{
	// electron.start();

	watch(['main.ts'], function()
	{
		// electron.restart();
	});

	watch(['index.html', './scss/**', './classes/**', './*.ts', './imgs/**'], function()
	{
		gulp.start(['ts', 'sass']);
	});
});

gulp.task('default', ['electron']);
