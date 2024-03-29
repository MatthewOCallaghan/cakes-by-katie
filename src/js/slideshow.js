const swiper = new Swiper('.swiper', {
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
        el: '.swiper-pagination',
        clickable: true
    },
    // Navigation arrows
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
});