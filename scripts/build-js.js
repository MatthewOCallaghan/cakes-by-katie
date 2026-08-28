const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

// Every .js file directly inside src/js is a page entry point, bundled by esbuild. Shared code
// lives in src/js/lib (and utils/images.js, which the Eleventy build uses too) and is pulled in
// by `import` rather than by being loaded as a separate <script> and left to share global scope.
//
// Bundling as IIFE rather than ESM is deliberate: `<script type="module">` is always deferred,
// and layout.njk loads imageSlideshow.js render-blocking on purpose so the above-the-fold
// carousel is built before first paint. IIFE keeps that choice available.
//
// Swiper is the one thing not bundled into its consumers: swiperVendor.js bundles it alone and
// hands it over on `window`, so a page with two carousels downloads and parses it once, and
// editing a slideshow doesn't re-hash 77KB of vendor code. See src/js/lib/swiper.js.
const SRC_DIR = path.join(__dirname, "..", "src", "js");
const OUT_DIR = path.join(__dirname, "..", "dist", "js");

const entryPoints = fs
    .readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(SRC_DIR, entry.name));

const options = {
    entryPoints,
    bundle: true,
    format: "iife",
    target: "es2020",
    outdir: OUT_DIR,
};

if (process.argv.includes("--watch")) {
    // Unminified in dev, for faster rebuilds and readable stack traces.
    esbuild
        .context(options)
        .then((ctx) => ctx.watch())
        .catch((error) => {
            // Without this a failure here is silent, and `npm run dev` serves a site with no JS.
            console.error("[build-js] watch failed to start:", error);
            process.exitCode = 1;
        });
} else {
    esbuild.buildSync({ ...options, minify: true });
}
