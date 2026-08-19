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
    safelist: {
        greedy: [/swiper-/],
    },
};
