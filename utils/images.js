const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

// Get relevant widths array from WIDTHS for this image
const getWidthsArrayForImagePath = path => {
    let imagePath = path.split('/images');
    imagePath = imagePath[imagePath.length - 1];
    for (const folder of Object.keys(WIDTHS)) {
        if (imagePath.startsWith(folder)) {
            return WIDTHS[folder];
        }
    }
    return WIDTHS.default;
}

// Get srcset attribute for <source> element
const getSrcsetAttribute = (pathWithoutExtension, extension) => {
    const sizes = getWidthsArrayForImagePath(pathWithoutExtension);
    return sizes.map(size => `${pathWithoutExtension}-${size}.${extension} ${size}w`).join(', ');
}


/*
    Get sizes attribute for <source> element.
    
    imageSizes must be order of smallest to largest
    
    recommendedSizes can be string or object. Object must have shape:
    {
        [breakpoint]: image width in px, em, or vw,
        any: image width in px, em, or vw, optional
    }
    Any number of breakpoints can be specified, and they will be used in a `max-width` media query.
    The value of the `any` key will be used as the final wildcard with no media query. If no `any` is specified,
    it will default to 100vw.
    For example, { 500: '100vw', 800: '600px', any: '50vw' } means the image used would be at least as wide as
    the screen width for screens of 500px or less; would be at least 600px wide on screens up to 800px; and at
    least half the screen width on all larger screens.
    Alternatively if recommendedSizes is a string it represents just the `any` value.
*/
const getSizesAttribute = (recommendedSizes) => {

    if (!recommendedSizes) {
        // Max image width is screen width
        return '100vw';
    }

    if (typeof recommendedSizes === 'string') {
        // No media queries, just wildcard value
        return recommendedSizes;
    }

    // Collect media queries
    const mediaConditions = Object.entries(recommendedSizes).reduce((acc, [maxScreenWidth, imageWidth]) => {
        if (maxScreenWidth === 'any') {
            // Ignore wildcard which will be added later
            return acc;
        }

        return acc.concat(`(max-width: ${maxScreenWidth}px) ${imageWidth}`);
    }, []);

    // Add wildcard
    mediaConditions.push(recommendedSizes.any ?? '100vw');

    return mediaConditions.join(', ');
}

// These should go from smallest file size to largest
const FORMATS = ["avif", "webp"];

// Get the src of the largest image in the most widely supported format (used as the fallback `<img src>` for browsers that don't use `<picture>`/`<source>`)
const getDefaultSrc = (pathWithoutExtension) => {
    const widths = getWidthsArrayForImagePath(pathWithoutExtension);
    const largestWidth = widths[widths.length - 1];
    const defaultFormat = FORMATS[FORMATS.length - 1];
    return `${pathWithoutExtension}-${largestWidth}.${defaultFormat}`;
}

// Intrinsic dimensions of an image, read at build time off the same generated variant that
// `<img src>` points at, so every image can carry width/height and reserve its space before it
// loads instead of the page reflowing around it. Resizing by width only preserves aspect ratio,
// so the variant's numbers give the original's ratio.
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

const WIDTHS = {
    default: [200, 400, 700, 1920],
    '/portfolio': [150, 300, 700, 1000, 1920],
    '/backgrounds': [640, 768, 1024, 1366, 1600, 1920],
    '/choices': [150, 300]
};

module.exports = {
    getWidthsArrayForImagePath,
    getSrcsetAttribute,
    getSizesAttribute,
    FORMATS,
    getDefaultSrc,
    getImageDimensions,
    WIDTHS
};