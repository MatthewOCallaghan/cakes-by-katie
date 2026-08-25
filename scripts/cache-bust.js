const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Reimplements the gulpfile's cache-busting step (previously gulp-rev-all): content-hash the
// built CSS/JS/non-portfolio images/videos/PDFs and rewrite every reference to them across the
// built HTML, so browsers can cache these assets for a year without serving stale content after
// a deploy.
//
// Portfolio images/videos and favicons are deliberately left unhashed — same exclusions
// gulp-rev-all used. Portfolio image/video paths are reconstructed client-side at runtime (see
// src/js/portfolioUtils.js and src/js/portfolioModal.js) from raw filenames in portfolio.json, so
// there's no literal string in the built output to find and replace. Favicons were never run
// through the old rev pipeline either.
//
// Assets are processed in dependency order rather than all at once:
//
//   1. hash the leaves (images, videos, PDFs) — nothing in dist/ references anything from them
//   2. rewrite references to those leaves inside CSS and JS
//   3. hash the CSS and JS, now that their contents are final
//   4. rewrite references to everything inside the HTML
//
// Doing it in one pass — hash everything, then rewrite — is what this script used to do, and it
// has a quiet failure mode: a stylesheet's hash would be computed before its `url()` references
// were rewritten, so the filename would no longer reflect the contents and a changed image
// wouldn't produce a changed stylesheet URL. Nothing in dist/ references an image from CSS or JS
// today, so this was latent rather than broken, but the ordering costs nothing to get right.
const ROOT = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");

// Directories (relative to dist/) whose files get hashed. `exclude` is a directory prefix
// (relative to the directory itself) to skip within it.
//
// Split into the assets nothing else in dist/ links out of, and the text assets that can
// themselves contain references — see the ordering note above.
const HASHED_LEAF_DIRS = [
    { dir: "images", exclude: "portfolio" },
    { dir: "videos", exclude: "portfolio" },
    { dir: "pdfs" },
];

const HASHED_TEXT_DIRS = [{ dir: "css" }, { dir: "js" }];

// Extensions whose contents are scanned for references to renamed assets.
const REWRITABLE_EXTENSIONS = [".html", ".css", ".js"];

function listFiles(rootDir, dir = rootDir, results = []) {
    if (!fs.existsSync(dir)) {
        return results;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            listFiles(rootDir, absolute, results);
        } else {
            results.push(path.relative(rootDir, absolute).split(path.sep).join("/"));
        }
    }
    return results;
}

function hashFile(absolutePath) {
    const contents = fs.readFileSync(absolutePath);
    return crypto.createHash("md5").update(contents).digest("hex").slice(0, 10);
}

// Insert the hash before the file's extension, e.g. "global.css" -> "global.3f9a1c2b4e.css".
function hashedName(filename, hash) {
    const extension = path.extname(filename);
    const base = filename.slice(0, filename.length - extension.length);
    return `${base}.${hash}${extension}`;
}

function hashEligibleFiles(dirs) {
    const renames = new Map(); // "/css/global.css" -> "/css/global.3f9a1c2b4e.css"

    for (const { dir, exclude } of dirs) {
        const absoluteDir = path.join(DIST_DIR, dir);
        for (const relativePath of listFiles(absoluteDir)) {
            if (exclude && (relativePath === exclude || relativePath.startsWith(`${exclude}/`))) {
                continue;
            }

            const oldAbsolute = path.join(absoluteDir, ...relativePath.split("/"));
            const hash = hashFile(oldAbsolute);
            const newRelativePath = path.posix.join(path.dirname(relativePath), hashedName(path.basename(relativePath), hash));
            const newAbsolute = path.join(absoluteDir, ...newRelativePath.split("/"));

            fs.renameSync(oldAbsolute, newAbsolute);
            renames.set(`/${dir}/${relativePath}`, `/${dir}/${newRelativePath}`);
        }
    }

    return renames;
}

// Longest-first so e.g. "/images/foo-1500.avif" is replaced before "/images/foo-150.avif" could
// partially match inside it.
function rewriteReferences(renames, extensions) {
    const orderedPaths = [...renames.keys()].sort((a, b) => b.length - a.length);
    const targetFiles = listFiles(DIST_DIR).filter((relativePath) => extensions.some((extension) => relativePath.endsWith(extension)));

    for (const relativePath of targetFiles) {
        const absolutePath = path.join(DIST_DIR, ...relativePath.split("/"));
        let contents = fs.readFileSync(absolutePath, "utf8");
        let changed = false;

        for (const oldPath of orderedPaths) {
            if (contents.includes(oldPath)) {
                contents = contents.split(oldPath).join(renames.get(oldPath));
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(absolutePath, contents);
        }
    }
}

function run() {
    if (!fs.existsSync(DIST_DIR)) {
        throw new Error("dist/ does not exist — run the rest of the build first.");
    }

    // 1 & 2: hash the leaves, then fix up the CSS/JS that may point at them, before those files
    // are themselves hashed.
    const leafRenames = hashEligibleFiles(HASHED_LEAF_DIRS);
    rewriteReferences(leafRenames, [".css", ".js"]);

    // 3: hash the CSS and JS now their contents are final.
    const textRenames = hashEligibleFiles(HASHED_TEXT_DIRS);

    // 4: point the HTML at all of it.
    const renames = new Map([...leafRenames, ...textRenames]);
    rewriteReferences(renames, REWRITABLE_EXTENSIONS);

    console.log(`[cache-bust] Hashed ${renames.size} file(s).`);
}

if (require.main === module) {
    run();
}

module.exports = { run };
