import gulp from 'gulp';
import gulpcache from 'gulp-cached';
import gulpESLintNew from 'gulp-eslint-new';

import gulpClean from 'gulp-clean';
import logger from 'gulp-logger-new';
import ts from 'gulp-typescript';

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

const tsProject = ts.createProject('tsconfig.json', {
    jsx: 'react-jsx',
});

function buildESM() {
    return tsProject
        .src()
        .pipe(gulpcache('ts-esm'))
        .pipe(
            logger({
                before: 'Starting...',
                after: 'Project compiled!',
                extname: '.js',
                showChange: true,
            }),
        )
        .pipe(gulpESLintNew())
        .pipe(gulpESLintNew.format())
        .pipe(tsProject())
        .pipe(gulp.dest('build'));
}

export async function clean() {
    return gulp.src('./build/src', { read: false }).pipe(gulpClean());
}

export const build = buildESM;
export default build;

export function watch() {
    gulp.watch(
        ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
        gulp.series(buildESM),
    );
}
