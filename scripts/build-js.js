const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const SRC_DIR = path.join(__dirname, "..", "src", "js");
const OUT_DIR = path.join(__dirname, "..", "dist", "js");

// Files that `import` an npm package (currently just Swiper, via src/js/testimonialsSlideshow.js
// and src/js/imageSlideshow.js) need `bundle: true` so that import resolves into the output file.
// Everything else in src/js/ is loaded as a classic, non-module <script> tag and relies on sharing
// a single global scope across files (see portfolioUtils.js, whose top-level declarations are
// consumed by portfolioGrid.js/portfolioModal.js via script load order, not imports) — bundling
// those would make esbuild tree-shake their "unused" top-level declarations away.
const BUNDLED_ENTRY_POINTS = ["testimonialsSlideshow.js", "imageSlideshow.js"];

const watch = process.argv.includes("--watch");

if (watch) {
    // Dev mode: Eleventy's passthrough copy handles every other file in src/js raw (see
    // eleventy.config.js), so here we only need to keep the bundled entry points up to date —
    // unminified, for faster rebuilds.
    esbuild
        .context({
            entryPoints: BUNDLED_ENTRY_POINTS.map((file) => path.join(SRC_DIR, file)),
            bundle: true,
            outdir: OUT_DIR,
        })
        .then((ctx) => ctx.watch());
} else {
    const allFiles = fs.readdirSync(SRC_DIR).filter((file) => file.endsWith(".js"));
    const bundledFiles = allFiles.filter((file) => BUNDLED_ENTRY_POINTS.includes(file));
    const plainFiles = allFiles.filter((file) => !BUNDLED_ENTRY_POINTS.includes(file));

    esbuild.buildSync({
        entryPoints: bundledFiles.map((file) => path.join(SRC_DIR, file)),
        bundle: true,
        minify: true,
        outdir: OUT_DIR,
    });

    esbuild.buildSync({
        entryPoints: plainFiles.map((file) => path.join(SRC_DIR, file)),
        minify: true,
        outdir: OUT_DIR,
    });
}
