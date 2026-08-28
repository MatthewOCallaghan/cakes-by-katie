const path = require('path');
const sizeOf = require('image-size');

const { getDefaultSrc } = require('./images');

// Split out of utils/images.js, which the browser bundle imports (see
// src/js/lib/portfolio-images.js) and so has to stay free of Node builtins. This half only ever
// runs during the Eleventy build.
//
// Intrinsic dimensions of an image, read off the same generated variant that `<img src>` points
// at, so every image can carry width/height and reserve its space before it loads instead of the
// page reflowing around it. Resizing by width only preserves aspect ratio, so the variant's
// numbers give the original's ratio.
//
// scripts/portfolio-data.js does the same probe for portfolio aspect ratios, but reads the
// smallest variant since a ratio is all it needs; here the src file's own size is what belongs
// in the attributes.
//
// A missing file warns rather than throwing: a half-finished page shouldn't break the dev
// server, and scripts/check-links.js fails the build in CI if a reference doesn't resolve.
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const dimensionsCache = new Map();
const warnedPaths = new Set();

const getImageDimensions = (pathWithoutExtension) => {
    const src = getDefaultSrc(pathWithoutExtension);

    if (dimensionsCache.has(src)) {
        return dimensionsCache.get(src);
    }

    const relative = src.replace(/^\/images\//, '');
    let dimensions = null;

    try {
        const { width, height } = sizeOf(path.join(IMAGES_DIR, ...relative.split('/')));
        dimensions = { width, height };
    } catch (error) {
        if (!warnedPaths.has(src)) {
            warnedPaths.add(src);
            console.warn(`[images] No file for ${src} — emitting <img> without width/height.`);
        }
    }

    dimensionsCache.set(src, dimensions);
    return dimensions;
};

module.exports = {
    getImageDimensions
};
