// Get relevant widths array from WIDTHS for this image
export const getWidthsArrayForImagePath = path => {
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
export const getSrcsetAttribute = (pathWithoutExtension, extension) => {
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
export const getSizesAttribute = (recommendedSizes) => {

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
export const FORMATS = ["avif", "webp"];

export const WIDTHS = {
    default: [200, 400, 700, 1920],
    '/portfolio': [150, 300, 700, 1000, 1920],
    '/backgrounds': [640, 768, 1024, 1366, 1600, 1920]
};