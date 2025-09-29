import gulp from 'gulp';
import gulpcache from 'gulp-cached';
import gulpClean from 'gulp-clean';
import gulpESLintNew from 'gulp-eslint-new';
import logger from 'gulp-logger-new';
import ts from 'gulp-typescript';

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

const tsProject = ts.createProject('tsconfig.json', {
    jsx: 'react-jsx',
});

// TypeScript/JavaScript build
function buildESM() {
    return tsProject
        .src()
        .pipe(gulpcache('ts-esm'))
        .pipe(
            logger({
                before: 'Starting TypeScript compilation...',
                after: 'TypeScript compiled!',
                extname: '.js',
                showChange: true,
            }),
        )
        .pipe(gulpESLintNew())
        .pipe(gulpESLintNew.format())
        .pipe(tsProject())
        .pipe(gulp.dest('build'));
}

// Copy CSS files
function copyCSS() {
    return gulp
        .src(['src/**/*.css', 'src/**/*.scss', 'src/**/*.sass'], { base: 'src' })
        .pipe(gulpcache('css'))
        .pipe(
            logger({
                before: 'Copying CSS files...',
                after: 'CSS files copied!',
                showChange: true,
            }),
        )
        .pipe(gulp.dest('build'));
}

// Copy static assets (images, fonts, etc.)
function copyAssets() {
    return gulp
        .src(
            [
                'src/**/*.png',
                'src/**/*.jpg',
                'src/**/*.jpeg',
                'src/**/*.gif',
                'src/**/*.svg',
                'src/**/*.ico',
                'src/**/*.woff',
                'src/**/*.woff2',
                'src/**/*.ttf',
                'src/**/*.eot',
                'src/**/*.otf',
                'src/**/*.json',
                '!src/**/*.config.json', // Exclude config files if needed
                '!src/**/tsconfig.json',
            ],
            { base: 'src' },
        )
        .pipe(gulpcache('assets'))
        .pipe(
            logger({
                before: 'Copying assets...',
                after: 'Assets copied!',
                showChange: true,
            }),
        )
        .pipe(gulp.dest('build'));
}

// Copy HTML files if any
function copyHTML() {
    return gulp
        .src('src/**/*.html', { base: 'src' })
        .pipe(gulpcache('html'))
        .pipe(
            logger({
                before: 'Copying HTML files...',
                after: 'HTML files copied!',
                showChange: true,
            }),
        )
        .pipe(gulp.dest('build'));
}

// Clean build directory
export async function clean() {
    return gulp.src('./build', { read: false, allowEmpty: true }).pipe(gulpClean());
}

// Build all
export const build = gulp.parallel(buildESM, copyCSS, copyAssets, copyHTML);

// Default task
export default build;

// Watch task with all file types
export function watch() {
    // Watch TypeScript/JavaScript files
    gulp.watch(
        ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
        gulp.series(buildESM),
    );

    // Watch CSS files
    gulp.watch(['src/**/*.css', 'src/**/*.scss', 'src/**/*.sass'], gulp.series(copyCSS));

    // Watch assets
    gulp.watch(
        [
            'src/**/*.png',
            'src/**/*.jpg',
            'src/**/*.jpeg',
            'src/**/*.gif',
            'src/**/*.svg',
            'src/**/*.ico',
            'src/**/*.woff',
            'src/**/*.woff2',
            'src/**/*.ttf',
            'src/**/*.eot',
            'src/**/*.otf',
            'src/**/*.json',
        ],
        gulp.series(copyAssets),
    );

    // Watch HTML files
    gulp.watch(['src/**/*.html'], gulp.series(copyHTML));
}

// Additional utility tasks
export const cleanBuild = gulp.series(clean, build);
export const dev = gulp.series(build, watch);
