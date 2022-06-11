const modal = document.querySelector('#portfolio-modal');

const MODAL_OPEN_CLASS = 'portfolio-modal-open';

const openModal = ({ target }) => {
    
    const images = target.getAttribute('data-images').split(',');
    const name = target.getAttribute('data-name');
    const description = target.getAttribute('data-description');

    // Images
    // Selected image
    setSelectedImage(images[0], name);

    // Thumbs
    const thumbs = modal.querySelector('#thumbs');
    if (images.length > 1) {
        removeAllChildren(thumbs);
        console.log(images);
        images.forEach(image => {
            console.log(image);
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
    

    document.body.classList.toggle(MODAL_OPEN_CLASS);
}

const closeModal = () => {
    document.body.classList.toggle(MODAL_OPEN_CLASS);
}

modal.querySelector('#modal-close').addEventListener('click', closeModal);

document.querySelectorAll('.portfolio-grid button.grid-item').forEach(element => {
    element.addEventListener('click', openModal);
});


const setSelectedImage = (filename, name) => {
    const selectedImage = modal.querySelector('#selected-image');
    removeAllChildren(selectedImage);
    createPictureElement(selectedImage, filename, name);
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