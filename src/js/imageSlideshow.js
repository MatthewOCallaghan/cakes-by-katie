// We aim for each carousel to be 1.5x screen width
// Remove any extra images to save us loading them
const carousels = document.querySelectorAll('.image-slideshow');
carousels.forEach(carousel => {
    // Height of each image
    const height = carousel.offsetHeight;

    const slides = carousel.querySelectorAll('.swiper-slide');

    // Sum width of each slide
    let totalWidth = 0;
    slides.forEach((slide) => {
        // Image aspect ratio
        const aspectRatio = parseFloat(slide.querySelector('.image-container').style.aspectRatio);
        
        // If width has exceeded 1.5x screen width, remove image
        if (totalWidth > screen.width * 1.5) {
            slide.remove();
        } else {
            // Otherwise keep image and keeping totaling width
            totalWidth += aspectRatio * height;
        }
    });
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