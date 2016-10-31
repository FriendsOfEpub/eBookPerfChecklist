/*jslint node: true */

'use strict';
// Require Gulp first
var gulp = require('gulp'),
//  packageJson = require('./package.json'),
// Load plugins
  $ = require('gulp-load-plugins')({lazy: true}),
// Static Web Server stuff
  browserSync = require('browser-sync'),
  reload = browserSync.reload,
  historyApiFallback = require('connect-history-api-fallback'),

// postcss
  postcss = require('gulp-postcss'),
// cleanCSS
  cleanCSS = require('gulp-clean-css'),
// Autoprefixer
  autoprefixer = require('autoprefixer'),

// SASS
  sass = require('gulp-ruby-sass'),
// SASSDoc
  sassdoc = require('sassdoc'),
// Critical CSS
  critical = require('critical'),
// Imagemin and Plugins
  imagemin = require('gulp-imagemin'),
  mozjpeg = require('imagemin-mozjpeg'),
  webp = require('imagemin-webp'),
// Utilities
  runSequence = require('run-sequence'),
  del = require('del'),
// precache and toolbox
  swPrecache = require('sw-precache'),
// gulp-md-template
  template = require('gulp-md-template'),
// precache and toolbox
  swPrecache = require('sw-precache');

//var key = '';
var site = 'https://caraya.github.io/athena-template/';

// List of browser versions we'll autoprefix for.
// Taken from the Polymer Starter Kit gulpfile
var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

/**
 * @name markdown
 * @description converts markdown to HTML and inserts it into the specified template file
 */
gulp.task('markdown', function () {
  return gulp.src('./src/templates/*.html')
    .pipe(template('./src/md-content'))
    .pipe(gulp.dest('./src'));
});


// SCSS conversion and CSS processing
/**
 * @name sass:dev
 * @description SASS conversion task to produce development css with expanded syntax.
 *
 * We run this task agains Ruby SASS, not lib SASS. As such it requires the SASS Gem to be installed
 *
 * @see {@link http://sass-lang.com|SASS}
 * @see {@link http://sass-compatibility.github.io/|SASS Feature Compatibility}
 */
gulp.task('sass:dev', function() {
  return sass('src/sass/**/*.scss', { sourcemap: true, style: 'expanded'})
    .pipe(gulp.dest('src/css'))
    .pipe($.size({
      pretty: true,
      title: 'SASS'
    }));
});

/**
 * @name scss-lint
 * @description Runs scss-lint against your SCSS files (will not work on files written with the original SASS syntax) to provide style checks.
 *
 * This task depends on the scss-lint Ruby gem
 *
 * @see {@link https://github.com/brigade/scss-lint|scss-lint}
 */
gulp.task('scss-lint', function() {
  return gulp.src(['src/scss/**/*.scss'])
    .pipe($.scsslint({
      'reporterOutputFormat': 'Checkstyle'
    }));
});

/**
 * @name sassdoc
 * @description generate documentation from your SASS stylesheets
 *
 * @see {@link http://sassdoc.com/|SASSDoc}
 * @see {@link http://sassdoc.com/getting-started/|SASSDoc documentation}
 */
gulp.task('sassdoc', function() {
  return gulp.src('src/sass/**/*.scss')
    .pipe(sassdoc({
      dest: 'src/sassdocs',
      verbose: true,
      display: {
        access: ['public', 'private'],
        alias: true
      }
    }));
});

/**
 * @name processCSS
 *
 * @description Run autoprefixer and cleanCSS on the CSS files under src/css
 *
 * Moved from gulp-autoprefixer to postcss. It may open other options in the future
 *
 * @see {@link https://www.npmjs.com/package/gulp-clean-css|gulp-clean-css}
 * @see {@link https://github.com/postcss/autoprefixer|autoprefixer}
 */
gulp.task('processCSS', function() {
  return gulp.src('src/css/**/*.css')
    .pipe($.sourcemaps.init())
    .pipe($.postcss([
      autoprefixer({ browsers: AUTOPREFIXER_BROWSERS })
    ]))
    .pipe(cleanCSS({
      advanced: false,
      aggressiveMerging: false,
      debug: true,
      keepBreaks: true,
      mediaMerging: false,
      processImport: false,
      rebase: false
    }, function(details) {
      console.log(details.name + ': ' + details.stats.originalSize);
      console.log(details.name + ': ' + details.stats.minifiedSize);
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('src/css/main-clean.css'))
    .pipe($.size({
      pretty: true,
      title: 'processCSS'
    }));
});

/**
 * @name uncss
 * @description Taking a css and an html file, UNCC will strip all CSS selectors not used in the page
 *
 * @see {@link https://github.com/giakki/uncss|uncss}
 */
gulp.task('uncss', function() {
  return gulp.src('src/css/**/*.css')
    .pipe($.concat('main.css'))
    .pipe($.uncss({
      html: ['index.html']
    }))
    .pipe(gulp.dest('css/main.css'))
    .pipe($.size({
      pretty: true,
      title: 'Uncss'
    }));
});

// Generate & Inline Critical-path CSS
gulp.task('critical', function() {
  return gulp.src('src/*.html')
    .pipe(critical({
      base: 'src/',
      inline: true,
      css: ['src/css/main.css'],
      minify: true,
      extract: false,
      ignore: ['font-face'],
      dimensions: [{
        width: 320,
        height: 480
      }, {
        width: 768,
        height: 1024
      }, {
        width: 1280,
        height: 960
      }]
    }))
    .pipe($.size({
      pretty: true,
      title: 'Critical'
    }))
    .pipe(gulp.dest('dist'));
});

/**
 * @name babel
 * @description Transpiles ES6 to ES5 using Babel. As Node and browsers support more of the spec natively this will move to supporting ES2016 and later transpilation
 *
 * It requires the `babel`, `babel-preset-es2015`, `babel-preset-es2016` and `babel-preset-es2017` plugins
 *
 * @see {@link http://babeljs.io/|Babel}
 * @see {@link http://babeljs.io/docs/learn-es2015/|Learn ES2015}
 * @see {@link http://www.ecma-international.org/ecma-262/6.0/|ECMAScript 2015 specification}
 */
gulp.task('babel', function() {
  return gulp.src('src/es6/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['es2015', 'es2016', 'es2017']
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('src/js/'))
    .pipe($.size({
      pretty: true,
      title: 'Babel'
    }));
});

/**
 * @name eslint
 * @description Runs eslint on all javascript files
 */
gulp.task('eslint', function() {
  return gulp.src(['**/*.js','!node_modules/**'])
    .pipe($.eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


/**
 * @name jsdoc
 * @description runs jsdoc on the gulpfile and README.md to genereate documentation
 *
 * @see {@link https://github.com/jsdoc3/jsdoc|JSDOC}
 */
gulp.task('jsdoc', function() {
  return gulp.src(['README.md', 'gulpfile.js'])
    .pipe($.jsdoc3());
});




/**
 * @name psi:mobile
 * @description Mobile performance check using Google Page Speed Insight
 *
 * Use the `nokey` option to try out PageSpeed Insights as part of your build process. For more frequent use, we recommend registering for your own API key.
 *
 * @see {@link https://developers.google.com/speed/docs/insights/v2/getting-started|PSI Getting Started}
 */
gulp.task('psi:mobile', function() {
  return $.psi(site, {
    // key: key
    nokey: 'true',
    strategy: 'mobile'
  }).then(function (data) {
    console.log('Speed score: ' + data.ruleGroups.SPEED.score);
    console.log('Usability score: ' + data.ruleGroups.USABILITY.score);
  });
});

/**
 * @name psi:desktop
 * @description Desktop performance check using Google Page Speed Insight
 *
 * Use the `nokey` option to try out PageSpeed Insights as part of your build process. For more frequent use, we recommend registering for your own API key.
 *
 * @see {@link https://developers.google.com/speed/docs/insights/v2/getting-started|PSI Getting Started}
 */
gulp.task('psi:desktop', function() {
  return $.psi(site, {
    nokey: 'true',
    // key: key,
    strategy: 'desktop'
  }).then(function (data) {
    console.log('Speed score: ' + data.ruleGroups.SPEED.score);
  });
});

/**
 * @name imagemin
 * @description Reduces image file sizes. Doubly important if we'll choose to play with responsive images.
 *
 * Imagemin will compress jpg (using mozilla's mozjpeg), SVG (using SVGO) GIF and PNG images but WILL NOT create multiple versions for use with responsive images
 *
 * @see {@link https://github.com/postcss/autoprefixer|Autoprefixer}
 * @see {@link processImages}
 */
gulp.task('imagemin', function() {
  return gulp.src('src/images/originals/**')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [
        {removeViewBox: false},
        {cleanupIDs: false}
      ],
      use: [mozjpeg()]
    }))
    .pipe(gulp.dest('src/images'))
    .pipe($.size({
      pretty: true,
      title: 'imagemin'
    }));
});

/**
 * @name processImages
 * @description processImages creates a set of responsive images for each of the PNG and JPG images in the images
 * directory
 *
 * @see {@link http://sharp.dimens.io/en/stable/install/|Sharp}
 * @see {@link https://github.com/jcupitt/libvips|LibVIPS dependency for Mac}
 * @see {@link https://www.npmjs.com/package/gulp-responsive|gulp-responsive}
 * @see {@link imagemin}
 *
 */
gulp.task('processImages', function() {
  return gulp.src(['src/images/**/*.{jpg,png}', '!src/images/touch/*.png'])
    .pipe($.responsive({
        '*': [{
          // image-small.jpg is 200 pixels wide
          width: 200,
          rename: {
            suffix: '-small',
            extname: '.jpg'
          }
        }, {
          // image-small@2x.jpg is 400 pixels wide
          width: 200 * 2,
          rename: {
            suffix: '-small@2x',
            extname: '.jpg'
          }
        }, {
          // image-large.jpg is 480 pixels wide
          width: 480,
          rename: {
            suffix: '-large',
            extname: '.jpg'
          }
        }, {
          // image-large@2x.jpg is 960 pixels wide
          width: 480 * 2,
          rename: {
            suffix: '-large@2x',
            extname: '.jpg'
          }
        }, {
          // image-extralarge.jpg is 1280 pixels wide
          width: 1280,
          rename: {
            suffix: '-extralarge',
            extname: '.jpg'
          }
        }, {
          // image-extralarge@2x.jpg is 2560 pixels wide
          width: 1280 * 2,
          rename: {
            suffix: '-extralarge@2x',
            extname: '.jpg'
          }
        }, {
          // image-small.webp is 200 pixels wide
          width: 200,
          rename: {
            suffix: '-small',
            extname: '.webp'
          }
        }, {
          // image-small@2x.webp is 400 pixels wide
          width: 200 * 2,
          rename: {
            suffix: '-small@2x',
            extname: '.webp'
          }
        }, {
          // image-large.webp is 480 pixels wide
          width: 480,
          rename: {
            suffix: '-large',
            extname: '.webp'
          }
        }, {
          // image-large@2x.webp is 960 pixels wide
          width: 480 * 2,
          rename: {
            suffix: '-large@2x',
            extname: '.webp'
          }
        }, {
          // image-extralarge.webp is 1280 pixels wide
          width: 1280,
          rename: {
            suffix: '-extralarge',
            extname: '.webp'
          }
        }, {
          // image-extralarge@2x.webp is 2560 pixels wide
          width: 1280 * 2,
          rename: {
            suffix: '-extralarge@2x',
            extname: '.webp'
          }
        }, {
          // Global configuration for all images
          // The output quality for JPEG, WebP and TIFF output formats
          quality: 80,
          // Use progressive (interlace) scan for JPEG and PNG output
          progressive: true,
          // Skip enalrgement warnings
          skipOnEnlargement: false,
          // Strip all metadata
          withMetadata: true
        }]
      })
      .pipe(gulp.dest('dist/images')));
});

/**
 * @name CopyAssets
 * @description Copies assets into the distribution directory. It excludes material that will be addressed by more specific tasks later
 */
gulp.task('copyAssets', function() {
  return gulp.src([
    'src/**/*',
    '!src/es6',
    '!src/scss',
    '!src/test',
    '!src/bower_components',
    '!src/fonts',
    '!src/cache-config.json',
    '!**/.DS_Store' // Mac specific directory we don't want to copy over
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe($.size({
      pretty: true,
      title: 'copy'
    }));
});

/**
 * @name clean
 * @description deletes specified files
 */
gulp.task('clean', function() {
  return del.sync([
    'dist/',
    '.tmp'
  ]);
});

gulp.task('service-worker', function(callback) {
  swPrecache.write(path.join(rootDir, 'service-worker.js'), {
    staticFileGlobs: [
      rootDir + '*.html',
      rootDir + 'js/**/*.js',
      rootDir + 'css/*.css',
      rootDir + 'apple-touch-icon.png',
      rootDir + 'img/**/*.{svg,png,jpg,gif}'
//    ],
//    importScripts: [
//      './node_modules/sw-toolbox/sw-toolbox.js',
//      './js/toolbox-scripts.js'
    ],
    stripPrefix: rootDir
  }, callback);

});

gulp.task('service-worker', function(callback) {
  swPrecache.write(path.join(rootDir, 'service-worker.js'), {
    staticFileGlobs: [
      rootDir + '*.html',
      rootDir + 'js/**/*.js',
      rootDir + 'css/*.css',
      rootDir + 'apple-touch-icon.png',
      rootDir + 'img/**/*.{svg,png,jpg,gif}'
    ],
    importScripts: [
      './js/sw-toolbox.js',
      './js/toolbox-scripts.js'
    ],
    stripPrefix: rootDir
  }, callback);

});
// Watch files for changes & reload
// This version serves content from the src source directory
gulp.task('serve', function() {
  browserSync({
    port: 2509,
    notify: false,
    logPrefix: 'ATHENA',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: ['.tmp', 'src'],
      middleware: [historyApiFallback()]
    }
  });

  gulp.watch(['src/**/*.html'], reload);
  gulp.watch(['src/css/**/*.scss'], ['sass', 'processCSS', reload]);
  gulp.watch(['src/images/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', function() {
  browserSync({
    port: 5001,
    notify: false,
    logPrefix: 'ATHENA',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: 'dist/',
    middleware: [historyApiFallback()]
  });
});

// COMBINED TASKS
gulp.task('prep', function() {
  runSequence('clean', ['copyAssets', 'copyBower', 'copyFonts'], 'processImages');
});
