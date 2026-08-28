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

// Loads the Swiper bundle on demand and resolves once it has set window.SwiperVendor.
//
// Pages without an image carousel don't need Swiper until the testimonials slideshow is nearly
// on screen, which on most pages is a long way down. `src` is passed in rather than hardcoded
// because the built filename is content-hashed; layout.njk puts the unhashed path on the
// consuming <script> tag and cache-bust.js rewrites it there like any other reference.
let pending = null;
export const loadSwiper = (src) => {
    if (window.SwiperVendor) {
        return Promise.resolve(window.SwiperVendor);
    }
    if (!pending) {
        pending = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(window.SwiperVendor);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return pending;
};
