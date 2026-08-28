import { getSwiper, loadSwiper } from './lib/swiper.js';

// Read at top-level execution, which for a classic deferred script is while currentScript is
// still set. On pages with an image carousel this is absent, because Swiper is already loaded
// render-blocking for that carousel and there is nothing to fetch.
const lazySwiperSrc = document.currentScript && document.currentScript.dataset.swiperSrc;

(() => {
    // Currently only supports one testimonial slideshow per page
    if (document.querySelectorAll('.testimonials-slideshow .swiper-wrapper .swiper-slide').length > 1) {
        const build = () => initialise(getSwiper());
        if (window.SwiperVendor || !lazySwiperSrc) {
            build();
        } else {
            whenApproaching(document.querySelector('.testimonials-slideshow'), () => loadSwiper(lazySwiperSrc).then(build));
        }
    }
})();

// Runs `onNear` once, when the element gets within a screen or so of the viewport — far enough
// ahead that Swiper has arrived and built the slideshow before it is scrolled to. Without
// IntersectionObserver, or with no element, just run it.
function whenApproaching(element, onNear) {
    if (!element || !('IntersectionObserver' in window)) {
        onNear();
        return;
    }
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                onNear();
            }
        },
        { rootMargin: '600px 0px' }
    );
    observer.observe(element);
}

function initialise({ Swiper, Autoplay, Pagination, Navigation }) {
    {
        const swiper = new Swiper('.testimonials-slideshow', {
            modules: [Autoplay, Pagination, Navigation],
            // Show grab cursor on mouse hover
            grabCursor: true,
            // Infinite loop
            loop: true,
            // Automatic slideshow
            autoplay: {
                delay: 10000, // Ms per slide
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            // Pagination bullets
            pagination: {
                el: '.testimonials-slideshow .swiper-pagination',
                clickable: true,
            },
            // Navigation arrows
            navigation: {
                nextEl: '.testimonials-slideshow .swiper-button-next',
                prevEl: '.testimonials-slideshow .swiper-button-prev',
            },
        });
    }
}
