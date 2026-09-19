import { FORMATS, getSrcsetAttribute, getSizesAttribute, getDefaultSrc } from '../../../utils/images.js';

// Builds a <picture> for a portfolio image at runtime. The portfolio grid, the modal and the
// image carousels all create their images in JS rather than in the template — the grid because it
// only materialises images as they come into view, the carousels because they decide which slides
// to keep from measured widths.
//
// The URL-building helpers come from utils/images.js, the same module the Eleventy build uses, so
// the widths and formats here cannot drift from the ones the images were generated at. This file
// replaces src/js/portfolioUtils.js, which was a hand copy of that logic carrying its own
// hardcoded portfolio width list.
export const createPictureElement = (container, filename, alt, recommendedSizes) => {
    const picture = document.createElement('picture');
    container.appendChild(picture);

    FORMATS.forEach((format) => {
        const source = document.createElement('source');
        source.type = `image/${format}`;
        source.srcset = getSrcsetAttribute(`/images/portfolio/${filename}`, format);
        source.sizes = getSizesAttribute(recommendedSizes);
        picture.appendChild(source);
    });

    const img = document.createElement('img');
    img.alt = alt;
    picture.appendChild(img);

    // For some reason Safari was fetching both avif and jpg files for each image
    // Not setting img src until it's appended to the DOM seems to fix this
    // Presumably this forces Safari to evaluate the <source> elements first
    img.src = getDefaultSrc(`/images/portfolio/${filename}`);
};
