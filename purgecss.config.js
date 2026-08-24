module.exports = {
    css: ["dist/css/*.css"],
    content: ["dist/**/*.html", "src/js/**/*.js"],
    output: "dist/css",
    // Swiper (bundled via esbuild/Sass rather than the unpkg CDN, see src/js/testimonialsSlideshow.js
    // and src/js/imageSlideshow.js) adds several of its own classes to the DOM purely at runtime
    // (active/next/prev slide, disabled nav buttons, etc.) — these never appear in the static HTML
    // PurgeCSS scans, so without this safelist they'd get stripped even though Swiper depends on them.
    // Unanchored: PurgeCSS tests this against the full selector text (e.g.
    // ".swiper:not(.swiper-vertical) .swiper-slide-active"), not a bare class name, so a
    // leading `^` would never match.
    //
    // This keeps everything Swiper ships, so the way to keep Swiper's CSS small is to import less
    // of it rather than to narrow this pattern — src/scss/swiper.scss now pulls in only the core
    // stylesheet plus navigation and pagination, instead of the whole bundle. Enumerating the
    // runtime class names here instead would be smaller still, but a missed one breaks a carousel
    // silently and only in production, which is not a trade worth making for a few hundred bytes.
    safelist: {
        greedy: [/swiper-/],
    },
};
