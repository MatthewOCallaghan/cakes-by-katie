// Uses Babel so we can use ES6 (explained at https://markgoodyear.com/2015/06/using-es6-with-gulp/)

import data from './src/data.json';
import { src, dest, watch, series, parallel } from 'gulp';
import browserSync from 'browser-sync';
import gulpSass from 'gulp-sass';
import sassCompiler from 'sass';
import useref from 'gulp-useref'; // Concatenates js and css files
import htmlmin from 'gulp-htmlmin';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import gulpIf from 'gulp-if';
import postcss from 'gulp-postcss';
import purgecss from 'gulp-purgecss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import revAll from 'gulp-rev-all'; // Puts hashes in filenames so browser's cache can hold assets for a long time but will fetch new assets if they have been updated (because file names will be different)
import imagemin from 'gulp-imagemin'; // Keeping this on v7 as importing v8 caused issues
import cache from 'gulp-cache';
import del from 'del';
import nunjucksRender from 'gulp-nunjucks-render';
import htmlPrettify from 'gulp-html-prettify';
import processData from 'gulp-data';
import sharpResponsive from 'gulp-sharp-responsive';
import sizeOf from 'image-size';
import getVideoDimensions from 'get-media-dimensions';
import { FORMATS, getSizesAttribute, getSrcsetAttribute, WIDTHS } from './utils/images';
import { removeExtension } from './utils/files';

import ftp from 'vinyl-ftp';
import logger from 'fancy-log';

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

function setupData() {
    data.imageFormats = {
        widths: WIDTHS,
        formats: FORMATS,
        defaultFormat: FORMATS[FORMATS.length - 1]
    };
    
    // Collect testimonials separately to make them easier to process
    data.testimonials = Object.entries(data.portfolio).reduce((acc, [cake, { testimonial }]) => testimonial ? acc.concat({ cake, ...testimonial }) : acc, []);

    // Get size of each portfolio image and video
    let videoPromises = [];

    for (const cake in data.portfolio) {
        const { images, videos } = data.portfolio[cake];
        images.forEach((src, index) => {
            const { width, height } = sizeOf(`src/images/portfolio/${src}`); // sizeOf also gets orientation and file type
            data.portfolio[cake].images[index] = { src, aspectRatio: width / height }; 
        });
        if (videos) {
            videos.forEach(({ file, thumb }, index) => {
                // Get thumb aspect ratio if it is not one of the images we have already measured
                if (!images.find(({ src }) => src === thumb)) {
                    const { width, height } = sizeOf(`src/images/portfolio/${src}`);
                    data.portfolio[cake].videos[index].thumbAspectRatio = width / height;
                }
                videoPromises.push(
                    getVideoDimensions(`src/videos/portfolio/${file}`, 'video') // getVideoDimensions also gets duration
                        .then(({ width, height }) => {
                            data.portfolio[cake].videos[index].aspectRatio = width / height;
                        })
                );
            });
        }
    }

    return Promise.all(videoPromises);
}

function processNunjucks() {

    const manageEnvironment = function(environment) {

        environment.addFilter('removeExtension', removeExtension);

        environment.addFilter('createSrcset', getSrcsetAttribute);

        environment.addFilter('createSizes', getSizesAttribute);

        environment.addFilter('stringifyElements', array => {
            return array.map(JSON.stringify);
        });
    }

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

const createAndTransferNewImages = () => {

    const widths = WIDTHS;
    const formats = FORMATS;

    return src('src/new-images/**/*')
            .pipe(gulpIf(['**/*.*', '!*.svg'], cache(sharpResponsive({
                includeOriginalFile: true,
                formats: widths.map(width => 
                    formats.map(format => ({
                        width,
                        format,
                        rename: { suffix: `-${width}`}
                    }))
                ).flat()
            }))))
            .pipe(dest('src/images'))
            .pipe(browserSyncInstance.reload({
                stream: true
            }));
}

const cleanNewImages = () => {
    return del(['src/new-images/**/*.*', '!src/new-images']);
}

const processNewImages = series(createAndTransferNewImages, cleanNewImages);

function reload(cb) {
    browserSyncInstance.reload();
    cb();
}

function watchFiles() {
    watch('src/scss/**/*.scss', processSass);
    watch(['src/pages/**/*.njk', 'src/templates/**/*.njk', 'src/data.json'], processNunjucks);
    watch('src/js/**/*.js', reload);
    watch('src/new-images/**/*', processNewImages);
}

function buildFiles() {
    const postcssPlugins = [autoprefixer(), cssnano()];
    return src(['src/**/*.html', 'src/images/**/*', 'src/videos/**/*'])
            .pipe(gulpIf('*.html', useref()))
            .pipe(gulpIf('*.html', htmlmin({ minifyJS: true, minifyCSS: true, removeComments: true, collapseWhitespace: true })))
            .pipe(gulpIf('*.js', babel({ presets: ['@babel/env']})))
            .pipe(gulpIf('*.js', uglify()))
            .pipe(gulpIf('*.css', purgecss({ content: ['src/**/*.html', 'src/**/*.js'] }))) // This should go in postcssPlugins but having tried briefly I couldn't get it to work
            .pipe(gulpIf('*.css', postcss(postcssPlugins)))
            .pipe(gulpIf('*.+(png|jpg|gif|svg)', cache(imagemin({ interlaced: true }))))
            // Can't add hashes to portfolio content as script needs to know what the filenames are called
            .pipe(revAll.revision({ dontRenameFile: ['.html', /^\/images\/portfolio\//, /^\/videos\/portfolio\//], dontUpdateReference: ['.html', /^\/images\/portfolio\//, /^\/videos\/portfolio\//]})) // Cache busting
            .pipe(dest('dist'));
}

// View CSS rejected by PurgeCSS
function rejectedCSS() {
    return src(['src/css/*.css'])
            .pipe(gulpIf('*.css', purgecss({ content: ['src/**/*.html', 'src/**/*.js'], rejected: true }))) // This should go in postcssPlugins but having tried briefly I couldn't get it to work
            .pipe(dest('rejected-css'));
}

function deploy() {
    const config = require('./config');

    const connection = ftp.create({
        host: config.host,
        user: config.FTP_USERNAME,
        password: config.FTP_PASSWORD,
        log: logger.log
    });

    const remoteFolder = config.remoteFolder;

    return src('dist/**/*.*', { base: 'dist', buffer: false }) // dist/**/*.* matches all files but not folders
        .pipe(connection.filter(remoteFolder, function(localFile, remoteFile, callback) {
            // If css or js files have been changed, revAll will have given them a different hash
            // References only get set (by revAll) in build function, so even if a reference to a css or js file has changed, an HTML file's modified date will be the last time I directly edited it
            // Thus cannot use connection.newer() to filter new files as if an HTML file has not been edited but its CSS file has been, the HTML with the updated reference to the CSS file will not get deployed
            // Thus I am using a custom filter function that keeps files that are new (no equivalent remote file), HTML (so all HTML files get pushed - which is not many - as trying to work out which files have updated references is complicated), or newer than their remote versions
            const emit = !remoteFile || localFile.extname === '.html' || localFile.stat.mtime > remoteFile.ftp.date;
            // TODO: Only need to check modified date in line above if file has no hash in name
            if (emit) {
                console.log(localFile);
            }
            callback(null, emit);
        }))
        .pipe(connection.dest(remoteFolder)) // Deploy
        // TODO: Filter function seems to be getting cut off but this doesn't happen if line below is removed
        // .pipe(connection.clean(['/**/*.js', '/**/*.css', '/images/**/*', '/videos/**/*'].map(p => remoteFolder + p), './dist', { base: remoteFolder })); // Remove remote files with no local version
}

function cleanDist() {
    return del('dist');
}

export const clearCache = (cb) => {
    return cache.clearAll(cb);
}

export const build = series(cleanDist, parallel(processSass, series(processNewImages, setupData, processNunjucks)), buildFiles);

export default series(parallel(processSass, series(processNewImages, setupData, processNunjucks)), setupBrowserSync, watchFiles);

exports.deploy = deploy;

exports.rejectedCSS = rejectedCSS;

exports.clearCache = clearCache;