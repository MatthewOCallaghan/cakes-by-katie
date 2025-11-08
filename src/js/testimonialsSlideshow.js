// Currently only supports one testimonial slideshow per page
if (document.querySelectorAll('.testimonials-slideshow .swiper-wrapper .swiper-slide').length > 1) {
    const swiper = new Swiper('.testimonials-slideshow', {
        // Show grab cursor on mouse hover
        grabCursor: true,
        // Infinite loop
        loop: true,
        // Automatic slideshow
        autoplay: {
            delay: 10000, // Ms per slide
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        // Pagination bullets
        pagination: {
            el: '.testimonials-slideshow .swiper-pagination',
            clickable: true
        },
        // Navigation arrows
        navigation: {
            nextEl: '.testimonials-slideshow .swiper-button-next',
            prevEl: '.testimonials-slideshow .swiper-button-prev',
        }
    });
}