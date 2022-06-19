// Uses Babel so we can use ES6 (explained at https://markgoodyear.com/2015/06/using-es6-with-gulp/)

import data from './src/data.json';
import { src, dest, watch, series, parallel } from 'gulp';
import browserSync from 'browser-sync';
import gulpSass from 'gulp-sass';
import sassCompiler from 'sass';
// import useref from 'gulp-useref'; // Concatenates js and css files
// import htmlmin from 'gulp-htmlmin';
// import babel from 'gulp-babel';
// import uglify from 'gulp-uglify';
import gulpIf from 'gulp-if';
// import postcss from 'gulp-postcss';
// import purgecss from 'gulp-purgecss';
// import autoprefixer from 'autoprefixer';
// import cssnano from 'cssnano';
// import revAll from 'gulp-rev-all'; // Puts hashes in filenames so browser's cache can hold assets for a long time but will fetch new assets if they have been updated (because file names will be different)
// import imagemin from 'gulp-imagemin';
import cache from 'gulp-cache';
import del from 'del';
import nunjucksRender from 'gulp-nunjucks-render';
import htmlPrettify from 'gulp-html-prettify';
import processData from 'gulp-data';
import sharpResponsive from 'gulp-sharp-responsive';
// const ftp = require('vinyl-ftp');
// const logger = require('fancy-log');
import { FORMATS, getSizesAttribute, getSrcsetAttribute, WIDTHS } from './utils/images';
import { removeExtension } from './utils/files';
const mode = require('gulp-mode')();

const browserSyncInstance = browserSync.create();
const sass = gulpSass(sassCompiler);

function setupBrowserSync(cb) {
    browserSyncInstance.init({
        server: {
            baseDir: 'src',
            serveStaticOptions: {
                extensions: ['html']
            }
        }
    });
    cb();
}

function processSass() {
    return src('src/scss/**/*.scss')
            .pipe(sass({ includePaths: ['node_modules'] }))
            .pipe(dest('src/css'))
            .pipe(browserSyncInstance.reload({
                stream: true
            }));
}

function processNunjucks() {

    const manageEnvironment = function(environment) {

        environment.addFilter('removeExtension', removeExtension);

        environment.addFilter('createSrcset', getSrcsetAttribute);

        environment.addFilter('createSizes', getSizesAttribute);

        environment.addFilter('stringifyElements', array => {
            return array.map(JSON.stringify);
        });

        // Get object with details of specific project from work array
        // environment.addFilter('getWorkInfo', function(work, page) {
        //     return work.filter(workItem => workItem.page === page)[0];
        // });

        // Count properties in an object
        // Used in work-template.njk
        // environment.addFilter('countProperties', function(obj) {
        //     return Object.keys(obj).length;
        // });

    }

    if (process.env.NODE_ENV !== 'production') {
        data.development = true;
    }
    data.imageFormats = {
        widths: WIDTHS,
        formats: FORMATS
    };

    data.testimonials = Object.entries(data.portfolio).reduce((acc, [cake, { testimonial }]) => testimonial ? acc.concat({ cake, ...testimonial }) : acc, []);

    return src('src/pages/**/*.njk')
        .pipe(processData(data))
        .pipe(nunjucksRender({
            path: ['src/templates/'],
            manageEnv: manageEnvironment
        }))
        .pipe(htmlPrettify()) // Corrects indentation to make HTML more readable
        .pipe(dest('src'))
        .pipe(browserSyncInstance.reload({
            stream: true
        }));
}

const createImageFormatsAndSizes = () => {

    const widths = data.imageFormats.widths;
    const formats = data.imageFormats.formats;

    return src('src/images-src/**/*')
            .pipe(mode.production(gulpIf(['**/*.*', '!*.svg'], cache(sharpResponsive({
                // includeOriginalFile: true,
                formats: widths.map(width => 
                    formats.map(format => ({
                        width,
                        format,
                        rename: { suffix: `-${width}`}
                    }))
                ).flat()
            })))))
            .pipe(dest('src/images'))
            .pipe(browserSyncInstance.reload({
                stream: true
            }));
}

const cleanImages = () => {
    return del(['src/images/**/*', '!src/images']);
}

const processImages = series(cleanImages, createImageFormatsAndSizes);

function reload(cb) {
    browserSyncInstance.reload();
    cb();
}

function watchFiles() {
    watch('src/scss/**/*.scss', processSass);
    watch(['src/pages/**/*.njk', 'src/templates/**/*.njk', 'src/data.json'], processNunjucks);
    watch('src/js/**/*.js', reload);
    watch('src/images-src/**/*', processImages);
}

// function buildFiles() {
//     const postcssPlugins = [autoprefixer(), cssnano()];
//     return src(['src/**/*.html', 'src/images/**/*.+(png|jpg|gif|svg)', 'src/videos/*'])
//             .pipe(gulpIf('*.html', useref()))
//             .pipe(gulpIf('*.html', htmlmin({ minifyJS: true, minifyCSS: true, removeComments: true, collapseWhitespace: true })))
//             .pipe(gulpIf('*.js', babel({ presets: ['@babel/env']})))
//             .pipe(gulpIf('*.js', uglify()))
//             .pipe(gulpIf('*.css', purgecss({ content: ['src/**/*.html', 'src/**/*.js'] }))) // This should go in postcssPlugins but having tried briefly I couldn't get it to work
//             .pipe(gulpIf('*.css', postcss(postcssPlugins)))
//             .pipe(gulpIf('*.+(png|jpg|gif|svg)', cache(imagemin({ interlaced: true }))))
//             .pipe(revAll.revision({ dontRenameFile: [".html"], dontUpdateReference: [".html"]})) // Cache busting
//             .pipe(dest('dist'));
// }

// Minfiy images now included in build files
// This is because images are needed in that pipe for revAll
// function minifyImages() {
//     return src('src/images/**/*.+(png|jpg|gif|svg)')
//             .pipe(cache(imagemin({ interlaced: true })))
//             .pipe(dest('dist/images'));
// }

// function deploy() {
//     const config = require('./config');

//     const connection = ftp.create( {
//         host: config.host,
//         user: process.env.FTP_USERNAME,
//         password: process.env.FTP_PASSWORD,
//         log: logger.log
//     });

//     const remoteFolder = config.remoteFolder;

//     return src('dist/**/*.*', { base: 'dist', buffer: false }) // dist/**/*.* matches all files but not folders
//         .pipe(connection.filter(remoteFolder, function(localFile, remoteFile, callback) {
//             // If css or js files have been changed, revAll will have given them a different hash
//             // References only get set (by revAll) in build function, so even if a reference to a css or js file has changed, an HTML file's modified date will be the last time I directly edited it
//             // Thus cannot use connection.newer() to filter new files as if an HTML file has not been edited but its CSS file has been, the HTML with the updated reference to the CSS file will not get deployed
//             // Thus I am using a custom filter function that keeps files that are new (no equivalent remote file), HTML (so all HTML files get pushed - which is only 6 - as trying to work out which files have updated references is complicated), or newer than their remote versions
//             callback(null, !remoteFile || localFile.extname === '.html' || localFile.stat.mtime > remoteFile.ftp.date);
//         }))
//         .pipe(connection.dest(remoteFolder)) // Deploy
//         .pipe(connection.clean(['/**/*.js', '/**/*.css', '/images/**/*', '/videos/**/*'].map(p => remoteFolder + p), './dist', { base: remoteFolder })); // Remove remote files with no local version

// }

function cleanDist() {
    return del('dist');
}

export const clearCache = (cb) => {
    return cache.clearAll(cb);
}

// export const build = series(cleanDist, parallel(processSass, processNunjucks, processImages), buildFiles);

export default series(parallel(processSass, processNunjucks, processImages), setupBrowserSync, watchFiles);

// exports.deploy = deploy;