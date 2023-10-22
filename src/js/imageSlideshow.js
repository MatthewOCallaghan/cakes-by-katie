const swiper = new Swiper('.swiper', {
    // Show grab cursor on mouse hover
    grabCursor: true,
    // Infinite loop
    loop: true,
    // Automatic slideshow
    autoplay: {
        delay: 1000, // Ms per slide
        disableOnInteraction: false,
        pauseOnMouseEnter: true
    },
    speed: 1500,
    slidesPerView: 'auto',
    spaceBetween: 5
});