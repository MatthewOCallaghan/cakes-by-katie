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
const ROOT = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");

// Directories (relative to dist/) whose files get hashed. `exclude` is a directory prefix
// (relative to the directory itself) to skip within it.
const HASHED_DIRS = [
    { dir: "css" },
    { dir: "js" },
    { dir: "images", exclude: "portfolio" },
    { dir: "videos", exclude: "portfolio" },
    { dir: "pdfs" },
];

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

function hashEligibleFiles() {
    const renames = new Map(); // "/css/global.css" -> "/css/global.3f9a1c2b4e.css"

    for (const { dir, exclude } of HASHED_DIRS) {
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
function rewriteReferences(renames) {
    const orderedPaths = [...renames.keys()].sort((a, b) => b.length - a.length);
    const htmlFiles = listFiles(DIST_DIR).filter((relativePath) => relativePath.endsWith(".html"));

    for (const relativePath of htmlFiles) {
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

    const renames = hashEligibleFiles();
    rewriteReferences(renames);

    console.log(`[cache-bust] Hashed ${renames.size} file(s).`);
}

if (require.main === module) {
    run();
}

module.exports = { run };
