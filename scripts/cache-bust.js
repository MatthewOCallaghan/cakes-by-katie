const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Content-hashes the built CSS/JS/non-portfolio images/videos/PDFs and rewrites every reference
// to them across the built HTML, so browsers can cache these assets for a year without serving
// stale content after a deploy.
//
// Portfolio images/videos and favicons are deliberately left unhashed. Portfolio image/video
// paths are reconstructed client-side at runtime (see src/js/lib/portfolio-images.js and
// src/js/portfolioModal.js) from raw filenames in portfolio.json, so there's no literal string
// in the built output to find and replace.
//
// Assets are processed in dependency order rather than all at once:
//
//   1. hash the leaves (images, videos, PDFs) — nothing in dist/ references anything from them
//   2. rewrite references to those leaves inside CSS and JS
//   3. hash the CSS and JS, now that their contents are final
//   4. rewrite references to everything inside the HTML
//
// The ordering matters: hashing a stylesheet before its `url()` references are rewritten would
// compute a hash that no longer reflects the file's contents, so a changed image wouldn't
// produce a changed stylesheet URL. Nothing in dist/ references an image from CSS or JS today,
// so this is latent rather than broken, but the ordering costs nothing to get right.
const ROOT = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const HEADERS_PATH = path.join(DIST_DIR, "_headers");

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

// Builds Cloudflare Pages' _headers file, giving every path this script just hashed a
// year-long, immutable Cache-Control — safe because a changed file gets a changed filename.
//
// The rules are derived from `leafRenames` itself rather than from a hand-maintained list of
// directory names, so a new `images/<category>` directory is covered by construction the moment
// something in it gets hashed, with nothing to remember.
//
// `dir` entries with no `exclude` (css, js, pdfs) are hashed in full, so one splat covers them.
// `dir` entries with an `exclude` (images, videos — both excluding portfolio) are decomposed
// into whichever subdirectories and loose top-level files actually turn up in the renames:
// `/images/:file` for the loose files (`:file` matches exactly one path segment, so this can't
// reach into a subdirectory) and one `/images/<category>/*` per subdirectory seen. A directory
// that was entirely excluded, like images/portfolio, never appears in the renames and so never
// gets a rule.
function buildHeadersFile(leafRenames, leafDirs, textDirs) {
    const rules = [];

    for (const { dir } of textDirs) {
        rules.push(`/${dir}/*`);
    }

    for (const { dir, exclude } of leafDirs) {
        if (!exclude) {
            rules.push(`/${dir}/*`);
            continue;
        }

        const prefix = `/${dir}/`;
        const subdirectories = new Set();
        let hasLooseFiles = false;

        for (const oldPath of leafRenames.keys()) {
            if (!oldPath.startsWith(prefix)) {
                continue;
            }
            const relative = oldPath.slice(prefix.length);
            const slash = relative.indexOf("/");
            if (slash === -1) {
                hasLooseFiles = true;
            } else {
                subdirectories.add(relative.slice(0, slash));
            }
        }

        if (hasLooseFiles) {
            rules.push(`/${dir}/:file`);
        }
        for (const subdirectory of [...subdirectories].sort()) {
            rules.push(`/${dir}/${subdirectory}/*`);
        }
    }

    const header = `# Cloudflare Pages headers config — generated by scripts/cache-bust.js, not hand-edited.
# https://developers.cloudflare.com/pages/configuration/headers/
#
# Every rule below matches only content-hashed files (see the hashing this script just did),
# so \`immutable\` is safe: a changed file gets a changed filename, nothing here can go stale.
#
# The rules themselves are derived from what actually got hashed, not from a maintained list of
# directory names — see buildHeadersFile in this script for why. Two things stay deliberately
# uncovered: images/portfolio and videos/portfolio are never hashed (their URLs are rebuilt
# client-side from bare filenames in portfolio.json — see src/js/lib/portfolio-images.js and
# src/js/portfolioModal.js), so a replaced photo isn't stuck behind a year-long cache; favicons
# aren't hashed either, for the same reason. Both fall back to Cloudflare's default
# ETag-revalidated caching.
#
# Cloudflare Pages applies every matching rule and APPENDS a repeated header rather than
# overriding it, so two rules matching the same path would double up their Cache-Control value.
# The rules below are kept mutually exclusive by construction: \`:name\` matches exactly one path
# segment and \`*\` crosses \`/\`, so a loose-file rule and a subdirectory rule for the same
# top-level directory can never both match the same path.
`;

    const body = rules.map((rule) => `${rule}\n  Cache-Control: public, max-age=31536000, immutable\n`).join("\n");

    return `${header}\n${body}`;
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

    fs.writeFileSync(HEADERS_PATH, buildHeadersFile(leafRenames, HASHED_LEAF_DIRS, HASHED_TEXT_DIRS));

    console.log(`[cache-bust] Hashed ${renames.size} file(s).`);
}

if (require.main === module) {
    run();
}

module.exports = { run };
