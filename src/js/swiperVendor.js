import Swiper, { Autoplay, Pagination, Navigation } from 'swiper';

// Loaded once and shared as a global by imageSlideshow.js and testimonialsSlideshow.js so Swiper
// only has to be downloaded/parsed once per page, even when both carousels are present.
window.SwiperVendor = { Swiper, Autoplay, Pagination, Navigation };
