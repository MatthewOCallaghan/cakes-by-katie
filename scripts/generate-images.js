const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { getWidthsArrayForImagePath, FORMATS } = require("../utils/images");
const { removeExtension } = require("../utils/files");

// Reimplements the gulpfile's responsive image pipeline (previously gulp-sharp-responsive)
// against a persistent, gitignored cache directory instead of a plain build-output folder, so
// that (like the old local/images folder) already-generated AVIF/WebP variants survive across
// runs and only new/changed source images get (re)processed — this is what makes rebuilds fast
// rather than reprocessing every image on every build.
const SRC_DIR = path.join(__dirname, "..", "src", "images");
const CACHE_DIR = path.join(__dirname, "..", ".image-cache");

// Recursively list files under `rootDir`, returned as root-relative paths with a leading "/"
// (e.g. "/portfolio/foo.jpg"), matching the format utils/images.js's helpers expect.
function listImageFiles(rootDir, dir = rootDir, results = []) {
    if (!fs.existsSync(dir)) {
        return results;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        // Skip dotfiles (e.g. macOS .DS_Store) — Gulp's src() glob ignored these by default,
        // but fs.readdirSync doesn't, so we filter them out ourselves.
        if (entry.name.startsWith(".")) {
            continue;
        }
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            listImageFiles(rootDir, absolute, results);
        } else {
            results.push("/" + path.relative(rootDir, absolute).split(path.sep).join("/"));
        }
    }
    return results;
}

// Delete cached images that are no longer wanted: their source no longer exists in src/images,
// or (for generated AVIF/WebP variants) their width is no longer in the configured set for
// that folder.
function cleanCache() {
    const srcImages = listImageFiles(SRC_DIR);
    const cachedImages = listImageFiles(CACHE_DIR);

    const toRemove = cachedImages.filter((image) => {
        /*
            '/portfolio/example-image-700.avif' => { path: 'portfolio/', copiedName: 'example-image', width: '700', createdExtension: 'avif' }
            '/example.svg' => { name: 'example', extension: 'svg' }
        */
        const match = image.match(
            `^\\/(?<path>.+\\/)*(((?<copiedName>.+)-(?<width>\\d+)\\.(?<createdExtension>${FORMATS.join("|")}))|((?<name>.+)\\.(?<extension>.+)))$`
        );
        if (!match) {
            return false;
        }

        const { path: subPath, name, extension, copiedName, width } = match.groups;
        if (name) {
            // Only SVGs are ever copied to the cache as-is (as themselves, not width/format
            // variants) — delete if the source SVG is gone.
            return extension === "svg" ? !srcImages.includes(image) : true;
        }

        const validWidths = getWidthsArrayForImagePath(image);
        return (
            !srcImages.find((srcImage) => removeExtension(srcImage) === `/${subPath ?? ""}${copiedName}`) ||
            !validWidths.includes(parseInt(width, 10))
        );
    });

    for (const image of toRemove) {
        fs.unlinkSync(path.join(CACHE_DIR, image));
    }
    if (toRemove.length > 0) {
        console.log(`[generate-images] Removed ${toRemove.length} stale cached image(s): ${toRemove.join(", ")}`);
    }
}

async function generateVariants(srcImagePath, image) {
    const withoutExtension = removeExtension(image);
    const widths = getWidthsArrayForImagePath(image);
    const outputDir = path.join(CACHE_DIR, path.dirname(withoutExtension));
    fs.mkdirSync(outputDir, { recursive: true });

    for (const width of widths) {
        for (const format of FORMATS) {
            const outputPath = path.join(CACHE_DIR, `${withoutExtension}-${width}.${format}`);
            if (fs.existsSync(outputPath)) {
                continue;
            }
            await sharp(srcImagePath).resize(width).toFormat(format).toFile(outputPath);
        }
    }
}

function copySvg(srcImagePath, image) {
    const outputPath = path.join(CACHE_DIR, image);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.copyFileSync(srcImagePath, outputPath);
}

// Generate whatever cached images (variants or SVG copies) are currently missing.
async function generateMissing() {
    const cachedImages = listImageFiles(CACHE_DIR);
    const srcImages = listImageFiles(SRC_DIR);

    for (const image of srcImages) {
        const srcImagePath = path.join(SRC_DIR, image);

        if (image.endsWith(".svg")) {
            if (!cachedImages.includes(image)) {
                console.log(`[generate-images] Copying ${image}`);
                copySvg(srcImagePath, image);
            }
            continue;
        }

        const withoutExtension = removeExtension(image);
        const widths = getWidthsArrayForImagePath(image);
        const hasAllVariants = FORMATS.every((format) => widths.every((width) => cachedImages.includes(`${withoutExtension}-${width}.${format}`)));

        if (!hasAllVariants) {
            console.log(`[generate-images] Building images for ${image}`);
            await generateVariants(srcImagePath, image);
        }
    }
}

async function run() {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    cleanCache();
    await generateMissing();
}

let watchTimer;

async function watch() {
    await run();
    console.log("[generate-images] watching src/images");
    fs.watch(SRC_DIR, { recursive: true }, () => {
        // Debounce: fs.watch can fire multiple events for a single file write.
        clearTimeout(watchTimer);
        watchTimer = setTimeout(() => {
            run().catch((error) => {
                console.error(error);
            });
        }, 200);
    });
}

if (require.main === module) {
    const mode = process.argv.includes("--watch") ? watch : run;
    mode().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { run, cleanCache, generateMissing };
