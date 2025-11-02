// Every carousel must be at least this width
const CAROUSEL_TARGET_WIDTH = screen.width * 1.5;

// Keep track of images used on page to try to avoid duplicates across multiple carousels
const imagesUsedOnPage = new Set();

const SLIDE_SELECTOR = '.swiper-slide';

// Process each carousel on page
const carousels = document.querySelectorAll('.image-slideshow');
carousels.forEach(carousel => {
    // Height of each image
    const height = carousel.offsetHeight;

    // Function to extract image info from a slide
    const extractImageInfo = slide => {

        const imageContainer = slide.querySelector('.image-container');
        const imageSrc = imageContainer.getAttribute('data-image');
        const imageAspectRatio = parseFloat(imageContainer.style.aspectRatio);

        return {
            container: imageContainer,
            src: imageSrc,
            aspectRatio: imageAspectRatio,
            widthInCarousel: imageAspectRatio * height,
            alt: imageContainer.getAttribute('data-alt')
        };
    }

    const slides = carousel.querySelectorAll(SLIDE_SELECTOR);

    // string[] of image sources we have chosen to use in this carousel
    const imagesToUse = [];
    // Images in this carousel that have already been used on page
    // { src: "image src", widthInCarousel: number }[]
    const duplicateImages = [];

    // Sum width of each slide
    let totalWidth = 0;

    // Iterate over each slide to select images to use
    for (const slide of slides) {
        
        if (totalWidth >= CAROUSEL_TARGET_WIDTH) {
            // Width limit reached
            break;
        }

        const { src, widthInCarousel } = extractImageInfo(slide);

        if (imagesUsedOnPage.has(src)) {
            // Image has already been used elsewhere on the page
            duplicateImages.push({ src, widthInCarousel });
        } else {
            // Use this image and keep totaling width
            imagesToUse.push(src);
            totalWidth += widthInCarousel;
        }
    }

    // If we don't have enough total width yet, add in duplicate images
    if (totalWidth < CAROUSEL_TARGET_WIDTH && duplicateImages.length > 0) {
        // We can add some duplicate images to reach the target width
        for (const { src, widthInCarousel } of duplicateImages) {
            if (totalWidth >= CAROUSEL_TARGET_WIDTH) {
                // Width limit reached
                break;
            }

            // Use this image and keep totaling width
            imagesToUse.push(src);
            totalWidth += widthInCarousel;
        }
    }

    // Now process slides by creating images for those we are using and removing others
    slides.forEach(slide => {
        const { src, alt, container } = extractImageInfo(slide);
        if (imagesToUse.includes(src)) {
            // Create image
            createPictureElement(container, src, alt, '250px');
            imagesUsedOnPage.add(src);
        } else {
            // Remove slide
            slide.remove();
        }
    });

    // If carousel is still not wide enough, we can duplicate slides
    // We duplicate all used slides so pattern is consistent
    const usedSlides = carousel.querySelectorAll(SLIDE_SELECTOR);
    const requiredRepetitions = Math.ceil(CAROUSEL_TARGET_WIDTH / totalWidth) - 1;
    for (let repeat = 0; repeat < requiredRepetitions; repeat++) {

        const swiperWrapper = carousel.querySelector('.swiper-wrapper');

        usedSlides.forEach(slide => {
            const clone = slide.cloneNode(true); // Deep clone
            swiperWrapper.appendChild(clone);
        });
    }
});

// Initialise Swiper for each carousel
const swiper = new Swiper('.swiper', {
    // Show grab cursor on mouse hover
    grabCursor: true,
    // Infinite loop
    loop: true,
    // Automatic slideshow
    autoplay: {
        delay: 500, // Ms per slide
        disableOnInteraction: false,
        pauseOnMouseEnter: true
    },
    speed: 1500,
    slidesPerView: 'auto',
    spaceBetween: 5,
    // Active slide is in centre rather than far left
    centeredSlides: true,
});