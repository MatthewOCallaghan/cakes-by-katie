// Uses Babel so we can use ES6 (explained at https://markgoodyear.com/2015/06/using-es6-with-gulp/)
import path from 'path';
import fs from 'fs';
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
import filter from 'gulp-filter';
import del from 'del';
import nunjucksRender from 'gulp-nunjucks-render';
import htmlPrettify from 'gulp-html-prettify';
import processData from 'gulp-data';
import sharpResponsive from 'gulp-sharp-responsive';
import sizeOf from 'image-size';
import getVideoDimensions from 'get-media-dimensions';
import { FORMATS, getSizesAttribute, getSrcsetAttribute, getWidthsArrayForImagePath, WIDTHS } from './utils/images';
import { removeExtension } from './utils/files';

import ftp from 'vinyl-ftp';
import logger from 'fancy-log';

let data;

const browserSyncInstance = browserSync.create();
const sass = gulpSass(sassCompiler);



/* -------------------------------------------------------------------------- */
/*                               /src -> /local                               */
/* -------------------------------------------------------------------------- */

function processSass() {
    return src('src/scss/**/*.scss')
            .pipe(sass({ includePaths: ['node_modules'] }))
            .pipe(dest('local/css'))
            .pipe(browserSyncInstance.reload({
                stream: true
            }));
}

function setupData() {
    data = JSON.parse(fs.readFileSync('./src/data.json', 'utf8'));

    data.imageFormats = {
        formats: FORMATS,
        defaultFormat: FORMATS[FORMATS.length - 1]
    };
    
    // Collect testimonials separately to make them easier to process
    data.testimonials = Object.entries(data.portfolio).reduce((acc, [cake, { testimonial }]) => testimonial ? acc.concat({ cake, ...testimonial }) : acc, []);

    // Get size of each portfolio image and video
    let videoPromises = [];

    for (const cake in data.portfolio) {
        const { images, videos, squareImage } = data.portfolio[cake];
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
        if (squareImage) {
            // Add 'square/' to path
            data.portfolio[cake].squareImage = 'square/' + squareImage;
        }
    }

    return Promise.all(videoPromises);
}

function processNunjucks() {

    const manageEnvironment = function(environment) {

        environment.addFilter('removeExtension', removeExtension);

        environment.addGlobal('createSrcset', getSrcsetAttribute);

        environment.addFilter('createSizes', getSizesAttribute);

        environment.addFilter('stringifyElements', array => {
            return array.map(JSON.stringify);
        });

        // Get array of cake keys matching specified filters
        // filters is object, e.g. { product: 'celebration-cake', occasion: 'birthday' }
        // `count` is desired number of cakes
        // `offset` is index of matching cake to return first (use to avoid duplicate image carousels on same page)
        environment.addGlobal('getMatchingCakes', (filters, count, offset = 0) => {

            // Cakes in portfolio that match filters
            const matchingCakes = Object.entries(data.portfolio).reduce((acc, [key, info]) => {
                for (let filterKey in filters) {
                    if (info[filterKey] !== filters[filterKey]) {
                        return acc;
                    }
                }

                return acc.concat(key);
            }, []);

            if (matchingCakes.length === 0) {
                return [];
            }

            // Index of `matchingCakes` to return first
            // Need to consider that offset could be greater than count
            // E.g. if offset is 5 and array length is 3, we must start on element with index 2
            const start = offset % matchingCakes.length;

            const selectedCakes = [];
            let i = start;
            while (selectedCakes.length < count) {
                selectedCakes.push(matchingCakes[i]);
                i++;
                if (i >= matchingCakes.length) {
                    i = 0;
                }
            }

            return selectedCakes;
        });
    }

    return src('src/pages/**/*.njk')
            .pipe(processData(data))
            .pipe(nunjucksRender({
                path: ['src/templates/'],
                manageEnv: manageEnvironment
            }))
            .pipe(htmlPrettify()) // Corrects indentation to make HTML more readable
            .pipe(dest('local'))
            .pipe(browserSyncInstance.reload({
                stream: true
            }));
}

/* --------------------------------- Images --------------------------------- */

// Get all files in /images directory in either src/ or local/
const getFilesInImagesDirectory = (directory, array = []) => {
    fs.readdirSync(directory).forEach(file => {
        const absolute = path.join(directory, file);
        if (fs.statSync(absolute).isDirectory()) {
            return getFilesInImagesDirectory(absolute, array);
        } else {
            return array.push(absolute.split('/images')[1]);
        }
    });
    return array;
}

// Delete images from /local that are no longer needed
const cleanLocalImages = () => {
    const srcImages = getFilesInImagesDirectory('src/images');
    const localImages = getFilesInImagesDirectory('local/images');
    
    const localImagesToRemove = localImages.filter(image => {
        /*
            REGEX: /^\/(?<path>.+\/)*(((?<copiedName>.+)-(?<width>\d+)\.(?<createdExtension>avif|webp))|((?<name>.+)\.(?<extension>.+)))$/

            Named capturing groups:

            '/portfolio/example-image-50.avif' => { path: 'portfolio/', copiedName: 'example-image', width: '50', createdExtension: 'avif' }
            '/portfolio/example-image-50.jpg' => { path: 'portfolio/', name: 'example-image-50', extension: 'jpg' }
            '/no-path-example.jpg' => { path: undefined, name: 'no-path-example', extension: 'jpg' }
        */
        const match = image.match(`^\\/(?<path>.+\\/)*(((?<copiedName>.+)-(?<width>\\d+)\\.(?<createdExtension>${FORMATS.join('|')}))|((?<name>.+)\\.(?<extension>.+)))$`);
        if (match) {
            const { path, name, extension, copiedName, width, createdExtension } = match.groups;
            if (name) {
                // Original image
                // Delete if original is no longer in /src
                return !srcImages.find(srcImage => srcImage === image);
            } else {
                // Created image
                const validWidths = getWidthsArrayForImagePath(image);
                // Delete image if original image is no longer in /src or we no longer use this size
                return !srcImages.find(srcImage => removeExtension(srcImage) === `/${path ?? ''}${copiedName}`) || !validWidths.includes(parseInt(width));
            }
        }
        return false;
    });

    if (localImagesToRemove.length > 0) {
        console.log(`Removing ${localImagesToRemove.length} image(s) from /local/images: ${localImagesToRemove.join(', ')}`);
    }

    return del(localImagesToRemove.map(image => `local/images/${image}`));
}

// Move new images to /local
// Includes building all required formats and sizes
const createAndTransferNewImages = () => {

    // Images already in /local/images
    const localImages = getFilesInImagesDirectory('local/images');
    
    // Folders for which we use different widths than default
    const imageFoldersWithUnqiueWidthsArray = Object.keys(WIDTHS).filter(key => key !== 'default');

    // Get all /src images and filter out any that we already have (along with all its formats and sizes) in /local
    let stream = src('src/images/**/*.*')
                        .pipe(filter(file => {
                            const image = file.path.split('/images')[1];
                            
                            // Process image if it is not in /local folder...
                            let keep = !localImages.includes(image);
                            // ... or if we are missing any required format/size
                            if (!keep && !image.endsWith('.svg')) {
                                const imageWithoutExtension = removeExtension(image);
                                const widths = getWidthsArrayForImagePath(file.path);
                                keep = !FORMATS.every(format => widths.every(width => localImages.includes(`${imageWithoutExtension}-${width}.${format}`)));
                            }
                            if (keep) {
                                if (image.endsWith('.svg')) {
                                    // SVGs don't need other formats/sizes so only get copied
                                    console.log(`Copying ${image}`);
                                } else {
                                    console.log(`Building images for ${image}`);
                                }
                            }
                            return keep;
                        }));

    // Create different image formats and sizes for directories with custom sizes
    for (const folder of imageFoldersWithUnqiueWidthsArray) {
        stream = stream.pipe(
            gulpIf(
                // Only process images in relevant folder
                (file) => {
                    const image = file.path.split('/images')[1];

                    const match = !image.endsWith('.svg') && image.startsWith(folder);
    
                    return match;
                },
                sharpResponsive({
                    includeOriginalFile: true,
                    formats: WIDTHS[folder].map(width => 
                        FORMATS.map(format => ({
                            width,
                            format,
                            rename: { suffix: `-${width}`}
                        }))
                    ).flat()
                })
            )
        );
    }

    // Create different image formats and sizes for all remaining images
    stream = stream.pipe(
        gulpIf(
            // Process images that are not in the directories already handled
            (file) => {
                const image = file.path.split('/images')[1];

                return !image.endsWith('.svg') && !imageFoldersWithUnqiueWidthsArray.some(folder => image.startsWith(folder));
            },
            sharpResponsive({
                includeOriginalFile: true,
                formats: WIDTHS.default.map(width => 
                    FORMATS.map(format => ({
                        width,
                        format,
                        rename: { suffix: `-${width}`}
                    }))
                ).flat()
            })
        )
    )
        // Output to /local/images
        .pipe(dest('local/images'))
        .pipe(browserSyncInstance.reload({
            stream: true
        }));

    return stream;
}

// Task for updating /local/images
const updateLocalImages = parallel(cleanLocalImages, createAndTransferNewImages);

/* ------------------------------ End of images ----------------------------- */

// Javascript files and videos just get moved as they are
const moveRemainingFilesToLocal = () => {
    return src(['src/**/*.mp4', 'src/**/*.js'])
            .pipe(dest('local'))
            .pipe(browserSyncInstance.reload({
                stream: true
            }));
}

/* -------------------------------------------------------------------------- */
/*                               Viewing locally                              */
/* -------------------------------------------------------------------------- */

function setupBrowserSync(cb) {
    browserSyncInstance.init({
        server: {
            baseDir: 'local',
            serveStaticOptions: {
                extensions: ['html']
            }
        }
    });
    cb();
}

function reload(cb) {
    browserSyncInstance.reload();
    cb();
}

function watchFiles() {
    watch('src/scss/**/*.scss', processSass);
    watch('src/data.json', series(setupData, processNunjucks));
    watch(['src/pages/**/*.njk', 'src/templates/**/*.njk'], processNunjucks);
    watch(['src/js/**/*', 'src/videos/**/*'], moveRemainingFilesToLocal);
    watch('src/images/**/*', updateLocalImages);
}

/* -------------------------------------------------------------------------- */
/*                     Build (/local -> /dist) and deploy                     */
/* -------------------------------------------------------------------------- */

function cleanDist() {
    return del('dist');
}

function buildFiles() {
    const postcssPlugins = [autoprefixer(), cssnano()];
    return src(['local/**/*.html', 'local/images/**/*', 'local/videos/**/*'])
            .pipe(gulpIf('*.html', useref()))
            .pipe(gulpIf('*.html', htmlmin({ minifyJS: true, minifyCSS: true, removeComments: true, collapseWhitespace: true })))
            .pipe(gulpIf('*.js', babel({ presets: ['@babel/env']})))
            .pipe(gulpIf('*.js', uglify()))
            .pipe(gulpIf('*.css', purgecss({ content: ['local/**/*.html', 'local/**/*.js'] }))) // This should go in postcssPlugins but having tried briefly I couldn't get it to work
            .pipe(gulpIf('*.css', postcss(postcssPlugins)))
            .pipe(gulpIf('*.+(png|jpg|gif|svg)', cache(imagemin({ interlaced: true }))))
            // Can't add hashes to portfolio content as script needs to know what the filenames are called
            .pipe(revAll.revision({ dontRenameFile: ['.html', /^\/images\/portfolio\//, /^\/videos\/portfolio\//], dontUpdateReference: ['.html', /^\/images\/portfolio\//, /^\/videos\/portfolio\//]})) // Cache busting
            .pipe(dest('dist'));
}

// View CSS rejected by PurgeCSS
function rejectedCSS() {
    return src(['local/css/*.css'])
            .pipe(gulpIf('*.css', purgecss({ content: ['local/**/*.html', 'local/**/*.js'], rejected: true })))
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

/* -------------------------------------------------------------------------- */
/*                                    Tasks                                   */
/* -------------------------------------------------------------------------- */

export const clearCache = (cb) => {
    return cache.clearAll(cb);
}

const updateLocalFolder = parallel(processSass, updateLocalImages, series(setupData, processNunjucks), moveRemainingFilesToLocal);

export const build = series(cleanDist, updateLocalFolder, buildFiles);

export default series(updateLocalFolder, setupBrowserSync, watchFiles);

exports.deploy = deploy;

exports.rejectedCSS = rejectedCSS;

exports.updateLocalImages = updateLocalImages;