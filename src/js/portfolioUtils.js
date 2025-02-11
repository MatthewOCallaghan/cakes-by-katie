/* -------------------------------------------------------------------------- */
/*         Copied from utils folder. Not sure how best to avoid this.         */
/* -------------------------------------------------------------------------- */

/* -------------------------------- images.js ------------------------------- */

const PORTFOLIO_IMAGE_WIDTHS = [150, 300, 700, 1000, 1920];

// Get srcset attribute for <source> element
const getSrcsetAttribute = (name, extension) =>
    PORTFOLIO_IMAGE_WIDTHS.map(size => `${name}-${size}.${extension} ${size}w`).join(', ');


// Get sizes attribute for <source> element
const getSizesAttribute = (recommendedSizes) => {

    if (!recommendedSizes) {
        return '100vw';
    }

    if (typeof recommendedSizes === 'string') {
        return recommendedSizes;
    }

    const mediaConditions = Object.entries(recommendedSizes).reduce((acc, [maxScreenWidth, imageWidth]) => {
        if (maxScreenWidth === 'any') {
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



/* ---------------------------- End of images.js ---------------------------- */

/* -------------------------------- files.js -------------------------------- */

// Get filename without extension
const removeExtension = (filename) =>
    filename.split('.')[0];

/* ----------------------------- End of files.js ---------------------------- */

/* -------------------------------------------------------------------------- */
/*                             End of copied code                             */
/* -------------------------------------------------------------------------- */

const createPictureElement = (container, filename, alt, recommendedSizes) => {
    const picture = document.createElement('picture');
    container.appendChild(picture);

    FORMATS.forEach(format => {
        const source = document.createElement('source');
        source.type = `image/${format}`;
        source.srcset = getSrcsetAttribute(`images/portfolio/${removeExtension(filename)}`, format);
        source.sizes = getSizesAttribute(recommendedSizes);
        picture.appendChild(source);
    });

    const img = document.createElement('img');
    img.src = `images/portfolio/${filename}`;
    img.alt = alt;
    picture.appendChild(img);
}