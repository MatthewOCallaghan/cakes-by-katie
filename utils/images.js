

// Get srcset attribute for <source> element
export const getSrcsetAttribute = (sizes, name, extension) =>
    sizes.map(size => `${name}-${size}.${extension} ${size}w`).join(', ');


// Get sizes attribute for <source> element
export const getSizesAttribute = (sizes) =>
    sizes.slice(0, sizes.length - 1).map(size => `(max-width: ${size}px) ${size}px`).concat(`${sizes[sizes.length - 1]}px`).join(', ');

export const FORMATS = ["webp", "avif", "png"];

export const WIDTHS = [640, 768, 1024, 1366, 1600, 1920];