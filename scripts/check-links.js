const fs = require('fs');
const path = require('path');

// Walks the built site and checks that every root-relative reference resolves to a file that
// actually exists in dist/. This is the cheapest guard against the failure modes this build
// invites: a mistyped `pages` key, an image variant that was never generated, a cache-busted
// path that didn't get rewritten, a page renamed without updating the links to it.
//
// Only internal references are checked — external URLs, mailto:, tel:, and fragments are the
// author's problem, not the build's.
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Attributes that can hold a URL we care about. `srcset` holds a comma-separated list of
// "<url> <descriptor>" pairs rather than a single URL, so it's parsed separately.
const URL_ATTRIBUTES = ['href', 'src', 'data-src', 'poster', 'content'];

function listHtmlFiles(dir, results = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            listHtmlFiles(absolute, results);
        } else if (entry.name.endsWith('.html')) {
            results.push(absolute);
        }
    }
    return results;
}

function extractReferences(html) {
    const references = new Set();

    for (const attribute of URL_ATTRIBUTES) {
        const pattern = new RegExp(`${attribute}="([^"]*)"`, 'g');
        for (const [, value] of html.matchAll(pattern)) {
            references.add(value);
        }
    }

    for (const [, value] of html.matchAll(/srcset="([^"]*)"/g)) {
        for (const candidate of value.split(',')) {
            references.add(candidate.trim().split(/\s+/)[0]);
        }
    }

    return references;
}

// Pages serves `/about` from `about.html` and `/foo/` from `foo/index.html`, so a reference is
// fine if any of those spellings exists on disk.
function resolves(reference) {
    const withoutQuery = reference.split(/[?#]/)[0];
    if (!withoutQuery.startsWith('/')) {
        return true;
    }

    const relative = withoutQuery.slice(1);
    const candidates = [relative, `${relative}.html`, path.posix.join(relative, 'index.html')];
    return candidates.some((candidate) => candidate !== '' && fs.existsSync(path.join(DIST_DIR, ...candidate.split('/'))));
}

function run() {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('dist/ does not exist — run `npm run build` first.');
        process.exit(1);
    }

    const broken = [];
    let checked = 0;

    for (const file of listHtmlFiles(DIST_DIR)) {
        const page = path.relative(DIST_DIR, file).split(path.sep).join('/');
        for (const reference of extractReferences(fs.readFileSync(file, 'utf8'))) {
            if (!reference.startsWith('/')) {
                continue;
            }
            checked++;
            if (!resolves(reference)) {
                broken.push({ page, reference });
            }
        }
    }

    if (broken.length > 0) {
        console.error(`[check-links] ${broken.length} broken reference(s):\n`);
        for (const { page, reference } of broken) {
            console.error(`  ${page} -> ${reference}`);
        }
        process.exit(1);
    }

    console.log(`[check-links] ${checked} internal reference(s) OK.`);
}

if (require.main === module) {
    run();
}

module.exports = { run };
