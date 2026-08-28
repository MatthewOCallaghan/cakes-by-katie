const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const getVideoDimensions = require('get-media-dimensions');
const { getWidthsArrayForImagePath, FORMATS } = require('../utils/images');

const ROOT = path.join(__dirname, '..');
const PORTFOLIO_JSON = path.join(ROOT, 'src/content/portfolio.json');

// Aspect ratios are read off the generated images/ variants rather than the original files in
// src/images (which aren't kept in the repo) — resizing by width only (no height) preserves
// aspect ratio, so any generated variant gives the same ratio as the original.
function getGeneratedImagePath(portfolioRelativeSrc) {
    const imagePath = '/portfolio/' + portfolioRelativeSrc;
    const smallestWidth = getWidthsArrayForImagePath(imagePath)[0];
    return path.join(ROOT, 'images', `${imagePath}-${smallestWidth}.${FORMATS[FORMATS.length - 1]}`);
}

// Computing this involves probing every portfolio image/video on disk (image-size, video
// duration), which is expensive enough to memoize rather than redo on every template that
// depends on the portfolio (e.g. src/_data/testimonials.js also needs this). Cached by the
// source file's mtime so `--watch` picks up edits to src/content/portfolio.json without
// requiring a dev server restart.
let cachedMtime;
let cachedPromise;

function computePortfolio() {
    const mtime = fs.statSync(PORTFOLIO_JSON).mtimeMs;
    if (mtime !== cachedMtime) {
        cachedMtime = mtime;
        cachedPromise = compute();
    }
    return cachedPromise;
}

async function compute() {
    const portfolio = JSON.parse(fs.readFileSync(PORTFOLIO_JSON, 'utf8'));

    const videoPromises = [];

    for (const cake in portfolio) {
        const { images, videos, squareImage } = portfolio[cake];

        images.forEach((src, index) => {
            const { width, height } = sizeOf(getGeneratedImagePath(src));
            portfolio[cake].images[index] = { src, aspectRatio: width / height };
        });

        if (videos) {
            videos.forEach(({ file, thumb }, index) => {
                // Get thumb aspect ratio if it is not one of the images we have already measured
                if (!images.find(({ src }) => src === thumb)) {
                    const { width, height } = sizeOf(getGeneratedImagePath(thumb));
                    portfolio[cake].videos[index].thumbAspectRatio = width / height;
                }
                videoPromises.push(
                    getVideoDimensions(path.join(ROOT, 'src/videos/portfolio', file), 'video') // getVideoDimensions also gets duration
                        .then(({ width, height }) => {
                            portfolio[cake].videos[index].aspectRatio = width / height;
                        })
                );
            });
        }

        if (squareImage) {
            // Add 'square/' to path
            portfolio[cake].squareImage = 'square/' + squareImage;
        }
    }

    await Promise.all(videoPromises);

    return portfolio;
}

module.exports = computePortfolio;
