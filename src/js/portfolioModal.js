
/* -------------------------------------------------------------------------- */
/*         Copied from utils folder. Not sure how best to avoid this.         */
/* -------------------------------------------------------------------------- */

/* -------------------------------- images.js ------------------------------- */

// Get srcset attribute for <source> element
const getSrcsetAttribute = (sizes, name, extension) =>
    sizes.map(size => `${name}-${size}.${extension} ${size}w`).join(', ');


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

const WIDTHS = [640, 768, 1024, 1366, 1600, 1920];

/* ---------------------------- End of images.js ---------------------------- */

/* -------------------------------- files.js -------------------------------- */

// Get filename without extension
const removeExtension = (filename) =>
    filename.split('.')[0];

/* ----------------------------- End of files.js ---------------------------- */

/* -------------------------------------------------------------------------- */
/*                             End of copied code                             */
/* -------------------------------------------------------------------------- */



const modal = document.querySelector('#portfolio-modal');

const scrollableContainer = modal.querySelector('.scrollable-container');

const MODAL_OPEN_CLASS = 'portfolio-modal-open';

const openModal = ({ target }) => {

    const button = target.closest('button');
    
    const images = button.getAttribute('data-images').split(';').map(JSON.parse);
    const name = button.getAttribute('data-name');
    const description = button.getAttribute('data-description');
    const videos = button.getAttribute('data-videos')?.split(';').map(JSON.parse) ?? [];
    const testimonialQuote = button.getAttribute('data-testimonial-quote');
    const testimonialCustomer = button.getAttribute('data-testimonial-customer');
    const testimonialLocation = button.getAttribute('data-testimonial-location');

    // Images and videos
    // Initial selected image/video
    if (videos.length > 0) {
        setSelectedVideo(videos[0]);
    } else {
        setSelectedImage(images[0], name);
    }    

    // Thumbs
    const thumbs = modal.querySelector('#thumbs');
    if (images.length > 1 || videos.length > 0) {
        removeAllChildren(thumbs);

        // Videos
        videos.forEach(video => {
            const button = document.createElement('button');
            const thumbAspectRatio = video.thumbAspectRatio ?? images.find(({ src }) => src === video.thumb)?.aspectRatio;
            button.style.aspectRatio = thumbAspectRatio;
            button.classList.add('video-thumb');
            button.setAttribute('aria-label', 'View video');
            button.addEventListener('click', () => setSelectedVideo(video));
            thumbs.appendChild(button);
            createPictureElement(button, video.thumb, name, `${80 * thumbAspectRatio}px`);
        });

        // Images
        images.forEach((image) => {
            const button = document.createElement('button');
            button.style.aspectRatio = image.aspectRatio;
            button.setAttribute('aria-label', 'View image');
            button.addEventListener('click', () => setSelectedImage(image, name));
            thumbs.appendChild(button);
            createPictureElement(button, image.src, name, `${80 * image.aspectRatio}px`);
        });
        thumbs.style.display = 'flex';
    } else {
        thumbs.style.display = 'none';
    }

    // Text
    // Title
    const title = modal.querySelector('#title');
    title.textContent = name;

    // Description
    const p = modal.querySelector('#description');
    if (description) {
        p.textContent = description;
        p.style.display = 'initial';
    } else {
        p.style.display = 'none';
    }

    // Testimonial
    const testimonial = modal.querySelector('#testimonial');
    if (testimonialQuote) {
        testimonial.style.display = 'block';
        modal.querySelector('blockquote').innerText = testimonialQuote;
        modal.querySelector('span').innerText = `${testimonialCustomer}, ${testimonialLocation}`;
    } else {
        testimonial.style.display = 'none';
    }

    // Layout
    // Always show vertical layout if no description or testimonial
    const container = modal.querySelector('.container');
    const TITLE_ONLY_CLASS = 'title-only';
    if (!description && !testimonialQuote) {
        container.classList.add(TITLE_ONLY_CLASS);
    } else {
        container.classList.remove(TITLE_ONLY_CLASS);
    }
    
    document.body.classList.toggle(MODAL_OPEN_CLASS);

    // Reset scroll
    // Must be done after it is made visible
    scrollableContainer.scrollTop = 0;

    gtag?.('event', 'open_portfolio_modal', {
        cake: name
    });
}

const closeModal = () => {
    document.body.classList.toggle(MODAL_OPEN_CLASS);
}

modal.querySelector('#modal-close').addEventListener('click', closeModal);

document.querySelectorAll('.portfolio-grid button.grid-item').forEach(element => {
    element.addEventListener('click', openModal);
});

const setSelectedMedia = (isVideo, filename, aspectRatio, name) => {
    const selectedImage = modal.querySelector('#selected-image');
    removeAllChildren(selectedImage);
    selectedImage.style.setProperty('--aspect-ratio', aspectRatio);

    if (isVideo) {
        const video = document.createElement('video');
        video.src = `videos/portfolio/${filename}`;
        video.controls = false;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        selectedImage.appendChild(video);
    } else {
        createPictureElement(selectedImage, filename, name, { 1200: `min(100vw, ${60 * aspectRatio}vh)`, any: `min(40vw, ${60 * aspectRatio}vh)` });
    }
}

const setSelectedImage = ({ src, aspectRatio }, name) => {
    setSelectedMedia(false, src, aspectRatio, name);    
}

const setSelectedVideo = ({ file, aspectRatio }) => {
    setSelectedMedia(true, file, aspectRatio);
}

const removeAllChildren = element => {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

const createPictureElement = (container, filename, alt, recommendedSizes) => {
    const picture = document.createElement('picture');
    container.appendChild(picture);

    FORMATS.forEach(format => {
        const source = document.createElement('source');
        source.type = `image/${format}`;
        source.srcset = getSrcsetAttribute(WIDTHS, `images/portfolio/${removeExtension(filename)}`, format);
        source.sizes = getSizesAttribute(recommendedSizes);
        picture.appendChild(source);
    });

    const img = document.createElement('img');
    img.src = `images/portfolio/${filename}`;
    img.alt = alt;
    picture.appendChild(img);
}