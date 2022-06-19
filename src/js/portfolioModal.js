const modal = document.querySelector('#portfolio-modal');

const MODAL_OPEN_CLASS = 'portfolio-modal-open';

const openModal = ({ target }) => {
    
    const images = target.getAttribute('data-images').split(',');
    const name = target.getAttribute('data-name');
    const description = target.getAttribute('data-description');
    const videos = target.getAttribute('data-videos')?.split(';').map(JSON.parse) ?? [];
    const testimonialQuote = target.getAttribute('data-testimonial-quote');
    const testimonialCustomer = target.getAttribute('data-testimonial-customer');
    const testimonialLocation = target.getAttribute('data-testimonial-location');

    // Images and videos
    // Initial selected image/video
    if (videos.length > 0) {
        setSelectedVideo(videos[0].file);
    } else {
        setSelectedImage(images[0], name);
    }    

    // Thumbs
    const thumbs = modal.querySelector('#thumbs');
    if (images.length > 1 || videos.length > 0) {
        removeAllChildren(thumbs);

        // Videos
        videos.forEach(({ file, thumb }) => {
            const button = document.createElement('button');
            button.classList.add('video-thumb');
            button.addEventListener('click', () => setSelectedVideo(file));
            thumbs.appendChild(button);
            createPictureElement(button, thumb, name);
        });

        // Images
        images.forEach(image => {
            const button = document.createElement('button');
            button.addEventListener('click', () => setSelectedImage(image, name));
            thumbs.appendChild(button);
            createPictureElement(button, image, name);
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
}

const closeModal = () => {
    document.body.classList.toggle(MODAL_OPEN_CLASS);
}

modal.querySelector('#modal-close').addEventListener('click', closeModal);

document.querySelectorAll('.portfolio-grid button.grid-item').forEach(element => {
    element.addEventListener('click', openModal);
});

const setSelectedMedia = (isVideo, filename, name) => {
    const selectedImage = modal.querySelector('#selected-image');
    removeAllChildren(selectedImage);

    if (isVideo) {
        const video = document.createElement('video');
        video.src = `/videos/${filename}`;
        video.controls = false;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        selectedImage.appendChild(video);
    } else {
        createPictureElement(selectedImage, filename, name);
    }
}

const setSelectedImage = (filename, name) => {
    setSelectedMedia(false, filename, name);    
}

const setSelectedVideo = (filename) => {
    setSelectedMedia(true, filename);
}

const removeAllChildren = element => {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

const createPictureElement = (container, filename, alt) => {
    const picture = document.createElement('picture');
    container.appendChild(picture);
    const img = document.createElement('img');
    img.src = `/images/portfolio/${filename}`;
    img.alt = alt;
    picture.appendChild(img);
}