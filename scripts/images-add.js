const fs = require("fs");
const path = require("path");
const readline = require("readline");
const sharp = require("sharp");
const { WIDTHS, FORMATS, getWidthsArrayForImagePath } = require("../utils/images");
const { removeExtension } = require("../utils/files");

const ROOT = path.join(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "images");

function copySvg(srcImagePath, image) {
    const outputPath = path.join(IMAGES_DIR, image);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.copyFileSync(srcImagePath, outputPath);
    return [outputPath];
}

async function generateVariants(srcImagePath, image) {
    const withoutExtension = removeExtension(image);
    const widths = getWidthsArrayForImagePath(image);
    const outputDir = path.join(IMAGES_DIR, path.dirname(withoutExtension));
    fs.mkdirSync(outputDir, { recursive: true });

    const generated = [];
    for (const width of widths) {
        for (const format of FORMATS) {
            const outputPath = path.join(IMAGES_DIR, `${withoutExtension}-${width}.${format}`);
            await sharp(srcImagePath).resize(width).toFormat(format).toFile(outputPath);
            generated.push(outputPath);
        }
    }
    return generated;
}

function existingOutputPaths(image, isSvg) {
    if (isSvg) {
        const outputPath = path.join(IMAGES_DIR, image);
        return fs.existsSync(outputPath) ? [outputPath] : [];
    }

    const withoutExtension = removeExtension(image);
    const widths = getWidthsArrayForImagePath(image);
    const candidates = widths.flatMap((width) => FORMATS.map((format) => path.join(IMAGES_DIR, `${withoutExtension}-${width}.${format}`)));
    return candidates.filter((candidate) => fs.existsSync(candidate));
}

function buildDestination(category, relativePath) {
    const categoryPrefix = category === "default" ? "" : category;
    return "/" + path.posix.join(categoryPrefix, relativePath).replace(/^\/+/, "");
}

// Chains all interactive prompts through nested rl.question() callbacks (rather than
// `await`-ing between separate calls) — with piped/non-TTY stdin, readline auto-closes as soon
// as the input stream ends, and any question asked after that silently never resolves. Nesting
// keeps each next question's registration synchronous with the previous answer, so it's safe
// under both a real terminal and piped input.
//
// Whether an image is SVG or raster is decided by the source file's real extension (isSvg),
// not by whatever the operator types here — raster destinations are extensionless (matching how
// portfolio.json/etc. now store image references), SVG destinations always keep a real `.svg`.
function promptForDestination(rl, defaultName, isSvg) {
    const categories = Object.keys(WIDTHS);
    console.log("\nWhich category does this image belong to?");
    categories.forEach((category, index) => console.log(`  ${index + 1}) ${category}`));

    return new Promise((resolve, reject) => {
        rl.question(`Enter a number [1-${categories.length}]: `, (categoryAnswer) => {
            const categoryIndex = parseInt(categoryAnswer, 10) - 1;
            if (Number.isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= categories.length) {
                reject(new Error(`Invalid choice: ${categoryAnswer}`));
                return;
            }
            const category = categories[categoryIndex];
            const destinationLabel = category === "default" ? "images/" : `images${category}/`;

            rl.question(`Destination path within ${destinationLabel} [${defaultName}]: `, (destinationAnswer) => {
                let image = buildDestination(category, destinationAnswer.trim() || defaultName);
                image = isSvg ? (image.toLowerCase().endsWith(".svg") ? image : `${image}.svg`) : removeExtension(image);

                const existing = existingOutputPaths(image, isSvg);

                if (existing.length === 0) {
                    resolve(image);
                    return;
                }

                console.log(`\nThese files already exist and will be overwritten:\n  ${existing.join("\n  ")}`);
                rl.question("Continue? [y/N] ", (overwriteAnswer) => {
                    if (overwriteAnswer.trim().toLowerCase() === "y") {
                        resolve(image);
                    } else {
                        resolve(null);
                    }
                });
            });
        });
    });
}

async function main() {
    const sourceArg = process.argv[2];
    if (!sourceArg) {
        console.error("Usage: npm run images:add -- <path-to-image>");
        process.exit(1);
    }

    const sourcePath = path.resolve(sourceArg);
    if (!fs.existsSync(sourcePath)) {
        console.error(`File not found: ${sourcePath}`);
        process.exit(1);
    }

    const isSvg = sourcePath.toLowerCase().endsWith(".svg");
    const defaultName = isSvg ? path.basename(sourcePath) : removeExtension(path.basename(sourcePath));

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    try {
        const image = await promptForDestination(rl, defaultName, isSvg);
        if (!image) {
            console.log("Aborted.");
            return;
        }

        const generated = isSvg ? copySvg(sourcePath, image) : await generateVariants(sourcePath, image);

        console.log(`\n[images:add] Generated ${generated.length} file(s):`);
        generated.forEach((file) => console.log(`  ${path.relative(ROOT, file)}`));
        console.log("\nRun `git add images` to stage them.");
    } finally {
        rl.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
