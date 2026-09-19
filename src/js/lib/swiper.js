// Swiper is bundled on its own by src/js/swiperVendor.js and handed over on `window`, rather
// than imported here. That is deliberate on two counts.
//
// Caching: Swiper is ~77KB minified and essentially never changes, while the two slideshows that
// use it are a couple of KB and do. Keeping them in separate content-hashed files means editing a
// slideshow re-downloads that couple of KB, not the whole 77KB — and dist/_headers serves these
// `immutable` for a year, so that boundary is worth keeping.
//
// Loading: sharing a bundle between entry points needs esbuild's code splitting, which only emits
// ESM, and `<script type="module">` is always deferred. layout.njk loads imageSlideshow.js
// render-blocking on purpose so the above-the-fold carousel is built before first paint.
//
// The accessor exists so that dependency is a named import rather than an ambient global.
export const getSwiper = () => window.SwiperVendor;
