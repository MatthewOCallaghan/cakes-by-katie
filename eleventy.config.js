const fs = require("fs");
const path = require("path");
const htmlmin = require("html-minifier-terser");
const { getSrcsetAttribute, getSizesAttribute, getDefaultSrc, getImageDimensions } = require("./utils/images");

// Kept in sync with BUNDLED_ENTRY_POINTS in scripts/build-js.js — these files `import` an npm
// package (Swiper) and only run once esbuild has bundled them, so they must never land in dist/js
// as raw source (see the passthrough copy below).
const BUNDLED_JS_ENTRY_POINTS = ["swiperVendor.js"];

module.exports = function (eleventyConfig) {
    eleventyConfig.addNunjucksGlobal("createSrcset", getSrcsetAttribute);
    eleventyConfig.addNunjucksGlobal("getDefaultSrc", getDefaultSrc);
    eleventyConfig.addNunjucksGlobal("getImageDimensions", getImageDimensions);
    eleventyConfig.addNunjucksFilter("createSizes", getSizesAttribute);

    eleventyConfig.addNunjucksFilter("stringifyElements", (array) => array.map((item) => JSON.stringify(item)));
    eleventyConfig.addNunjucksFilter("objectToArray", (object) => Object.values(object));

    // Navigation entries -> the shape macros/grid-menu-links.njk wants
    eleventyConfig.addNunjucksFilter("linkTiles", (links) =>
        links.map(({ href, tile }) => ({ href, title: tile.title, imageSrc: tile.image, imageAlt: tile.alt, colour: tile.colour }))
    );

    // Get array of cake keys matching specified filters, piped from the `portfolio` global data,
    // e.g. `{{ portfolio | getMatchingCakes({ product: 'wedding-cake' }) }}`.
    // filters is object, e.g. { product: 'celebration-cake', occasion: 'birthday' }
    // `count` is desired number of cakes. If not specified, all matching cakes are returned
    // `offset` is index of matching cake to return first (use to avoid duplicate image carousels on same page)
    // `testimonials` is a boolean indicating whether these cakes will be used for testimonials
    eleventyConfig.addNunjucksFilter("getMatchingCakes", (portfolio, filters, { count, offset = 0, testimonials = false } = {}) => {
        // Cakes in portfolio that match filters
        const matchingCakes = Object.entries(portfolio).reduce((acc, [key, info]) => {
            for (let filterKey in filters) {
                // Convert strings to arrays
                const cakeData = Array.isArray(info[filterKey]) ? info[filterKey] : [info[filterKey]];
                if (!cakeData.includes(filters[filterKey])) {
                    return acc;
                }
            }

            if (testimonials && (!info.testimonial || info.testimonial.text.length > 320)) {
                return acc;
            }

            return acc.concat(key);
        }, []);

        if (matchingCakes.length === 0) {
            return [];
        }

        // If no count specified, return all matching cakes
        if (!count) {
            // Cap count at 90 which is more than we'd actually need
            // Except for testimonials slideshows which we cap at 6
            count = Math.min(matchingCakes.length, testimonials ? 6 : 90);
        }

        // Index of `matchingCakes` to return first
        // Need to consider that offset could be greater than count
        // E.g. if offset is 5 and array length is 3, we must start on element with index 2
        const start = offset % matchingCakes.length;

        const selectedCakes = [];
        let i = start;
        while (selectedCakes.length < count) {
            selectedCakes.push(matchingCakes[i]);
            i++;
            if (i >= matchingCakes.length) {
                i = 0;
            }
        }

        return selectedCakes;
    });

    // Get list of flavour names as string (with commas and 'and') where first variant excludes specified diet
    eleventyConfig.addNunjucksGlobal("getFlavoursWithDietExclusion", (flavours, diet) => {
        const matchingFlavours = Object.values(flavours).reduce((acc, { name, variants }) => {
            if (!variants[0].diets.includes(diet)) {
                acc.push(name);
            }
            return acc;
        }, []);

        return matchingFlavours.length > 2
            ? `${matchingFlavours.slice(0, -1).join(", ")}, and ${matchingFlavours[matchingFlavours.length - 1]}`
            : matchingFlavours.join(" and ");
    });

    // Minify the rendered HTML.
    // Runs before scripts/cache-bust.js rewrites asset paths, which is fine: that step does
    // plain string replacement on full paths and doesn't care about the surrounding whitespace.
    eleventyConfig.addTransform("minify-html", function (content) {
        if (!this.page.outputPath || !this.page.outputPath.endsWith(".html")) {
            return content;
        }

        return htmlmin.minify(content, {
            collapseWhitespace: true,
            conservativeCollapse: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
        });
    });

    // Responsive images (AVIF/WebP at multiple widths) are pre-generated and committed to
    // images/ (via `npm run images:add`), not built by Eleventy — this is a straight passthrough copy.
    eleventyConfig.addPassthroughCopy({ images: "images" });

    eleventyConfig.addPassthroughCopy({ "src/videos": "videos" });
    eleventyConfig.addPassthroughCopy({ "src/pdfs": "pdfs" });
    eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
    // Raw JS, so `npm run dev` alone has working scripts.
    // `npm run build` overwrites these with esbuild-minified versions afterwards.
    // Excludes BUNDLED_JS_ENTRY_POINTS — those use `import` and only work once esbuild has
    // bundled them, so `npm run dev` runs esbuild in watch mode for those instead (see the
    // "dev" script in package.json).
    fs.readdirSync(path.join(__dirname, "src/js"))
        .filter((file) => file.endsWith(".js") && !BUNDLED_JS_ENTRY_POINTS.includes(file))
        .forEach((file) => {
            eleventyConfig.addPassthroughCopy({ [`src/js/${file}`]: `js/${file}` });
        });
    eleventyConfig.addPassthroughCopy({ favicon: "." });

    // No passthrough for _headers: scripts/cache-bust.js writes dist/_headers itself, once it
    // knows which files it has hashed and can generate cache rules that match exactly.

    // Sass isn't part of Eleventy's own build (compiled separately via npm scripts),
    // but watch it here so `npm run dev`'s Eleventy dev server reloads when it changes.
    eleventyConfig.addWatchTarget("src/scss");
    eleventyConfig.addWatchTarget("src/js");

    return {
        dir: {
            input: "src/pages",
            includes: "../_includes",
            data: "../_data",
            output: "dist",
        },
    };
};
