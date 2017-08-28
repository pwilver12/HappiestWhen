import gulp from 'gulp';
import gulpLoadPluginsModule from 'gulp-load-plugins';
import babelify from 'babelify';
import browserify from 'browserify';
import browserSyncModule from 'browser-sync';
import del from 'del';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import ftp from 'vinyl-ftp';

const $$ = gulpLoadPluginsModule();
const browserSync = browserSyncModule.create();
const reload = browserSync.reload;

const paths = {
  src: {
    sass: ['./src/sass/**/*.sass'],
    js: ['./src/js/**/*.js'],
    bundleJs: ['./src/js/index.js'],
    html: ['./src/views/**/*.ejs']
  },
  dest: {
    css: './build/css',
    js: './build/js',
    html: './build/html/',
    startPath: './build/html/pages'
  }
};

gulp.task('clean:css', (done) =>
  del(['./build/css/**/*.css'], done));

gulp.task('clean:js', (done) =>
  del(['./build/js/**/*.js'], done));

gulp.task('sass', ['clean:css'], () =>
  gulp.src(paths.src.sass)
    .pipe($$.sass())
    .on('error', $$.sass.logError)
    .pipe($$.autoprefixer())
    .pipe($$.cssnano({
      zindex: false
    }))
    .pipe($$.concat('styles.css'))
    .pipe(gulp.dest(paths.dest.css))
    .pipe(browserSync.stream()));

gulp.task('js', ['clean:js'], () =>
    browserify({
      entries: paths.src.bundleJs,
      extensions: ['.js'],
      debug: true
    })
    .transform(babelify)
    .on('error', $$.notify.onError({
      title: 'Error while bundling entities',
      message: 'File: <%=error.fileName.replace(/.+?client\\/src\\/app\\//, "")%>',
      emitError: true,
      wait: true
    }))
    .on('error', (err) => {
      $$.util.log(err);
      this.emit('end');
    })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe($$.uglify())
    .pipe(gulp.dest(paths.dest.js))
    .on('end', reload));

gulp.task('ejs', () =>
  gulp.src(paths.src.html)
    .pipe($$.ejs({
      msg: 'Hello Gulp!'
    }, {
      ext: '.html'
    }).on('error', $$.util.log))
    .pipe(gulp.dest(paths.dest.html)));

// Reload html file when changes are saved
gulp.task('html', () =>
  gulp.src(paths.src.html)
  .on('end', reload));

gulp.task('serve', () => {
  browserSync.init({
    server: './',
    startPath: paths.dest.startPath
  });
  gulp.watch(paths.src.sass, ['sass']);
  gulp.watch(paths.src.js, ['js']);
  gulp.watch(paths.src.html, ['ejs', 'html']);
});

gulp.task('deploy', () => {
  const conn = ftp.create({
    host: 'ftp.hubapi.com',
    user: FTP_HW_USERNAME,
    password: FTP_HW_PASSWORD,
    port: 3200,
    secure: true
  });

  const globs = [
    'build/css/**',
    'build/js/**'
  ];

  return gulp.src(globs, { buffer: false })
    .pipe(conn.dest(process.env.FTP_HW_PATH));
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['js', 'sass', 'ejs'], () => {
  gulp.run('serve');
});
