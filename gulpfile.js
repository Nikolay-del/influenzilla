import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import csso from 'postcss-csso';
import rename from 'gulp-rename';
import terser from 'gulp-terser';
import squoosh from 'gulp-libsquoosh';
import svgo from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';
import del from 'del';
import browser from 'browser-sync';
import htmlmin from 'gulp-htmlmin';
import postcssRem from "postcss-rem";
import postcssEm from "postcss-em";
import fileinclude from "gulp-file-include"

// Styles

export const styles = () => {
    return gulp.src('source/sass/style.scss', {
        sourcemaps: true
    })
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([
            autoprefixer(),
            csso(),
            postcssRem(),
            postcssEm(),
        ]))
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('build/css', {
            sourcemaps: '.'
        }))
        .pipe(browser.stream());
}


// HTML

const html = () => {
  return gulp.src('source/html/*.html')
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .on('error', function(err) {
      console.log('Error in file include:', err.message);
      this.emit('end'); // Continue with the pipeline
    })
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('build'));
}

// Scripts

const scripts = () => {
    return gulp.src('source/js/**/*.js')
        .pipe(gulp.dest('build/js'))
        .pipe(browser.stream());
}

const optimizeJS = () => {
    return gulp.src('source/js/**/*.js')
        .pipe(terser())
        .pipe(gulp.dest('build/js'))
        .pipe(browser.stream());
}

// Images

const optimizeImages = () => {
    return gulp.src('source/img/**/*.{png,jpg}')
        .pipe(squoosh())
        .pipe(gulp.dest('build/img'))
}

const copyImages = () => {
    return gulp.src('source/img/**/*.{png,jpg}')
        .pipe(gulp.dest('build/img'))
}

// WebP

const createWebp = () => {
    return gulp.src('source/img/**/*.{png,jpg}')
        .pipe(squoosh({
            webp: {}
        }))
        .pipe(gulp.dest('build/img'))
}

// SVG

const svg = () =>
    gulp.src(['source/img/**/*.svg', '!source/img/sprite/*.svg'])
        .pipe(svgo())
        .pipe(gulp.dest('build/img'));

const sprite = () => {
    return gulp.src('source/img/sprite/*.svg')
        .pipe(svgo())
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename('sprite.svg'))
        .pipe(gulp.dest('build/img'));
}

// Copy

const copy = (done) => {
    gulp.src([
        'source/fonts/**/*.{woff2,woff}',
        'source/*.ico',
        'source/favicons/*',
        'source/*.webmanifest',
        'source/css/*.css'
    ], {
        base: 'source'
    })
        .pipe(gulp.dest('build'))
    done();
}


// Clean

const clean = () => {
    return del('build');
};

// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    notify: false,
    open: false,
    cors: true,
  });
  done();
}

// Reload

const reload = (done) => {
    browser.reload();
    done();
}

// Watcher

const watcher = () => {
    gulp.watch('source/sass/**/*.scss', gulp.series(styles));
    gulp.watch('source/js/**/*.js', gulp.series(scripts));
    gulp.watch('source/html/**/*.html', gulp.series(html, reload));
    gulp.watch('source/img/**/*.{png,jpg}', gulp.series(copyImages, createWebp));
    gulp.watch(['source/img/**/*.svg', '!source/img/sprite/*.svg'], gulp.series(svg));
    gulp.watch('source/img/sprite/*.svg', gulp.series(sprite));
}

// Build

export const build = gulp.series(
    clean,
    copy,
    optimizeImages,
    gulp.parallel(
        styles,
        html,
        svg,
        optimizeJS,
        sprite,
        createWebp
    )
);

// Default


export default gulp.series(
    clean,
    copy,
    copyImages,
    gulp.parallel(
        styles,
        html,
        scripts,
        svg,
        sprite,
        createWebp
    ),
    gulp.series(
        server,
        watcher
    ));

export const layout = gulp.series(
    gulp.parallel(
        html,
        sprite,
        createWebp,
    ),
    gulp.series(
        server,
        watcher
    ));
