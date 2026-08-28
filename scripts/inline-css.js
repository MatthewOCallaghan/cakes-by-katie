const fs = require('fs');
const path = require('path');

/*
    Inlines the render-blocking stylesheets into each page and drops their <link> tags.

    Why: after the fonts were self-hosted, the only render-blocking requests left were our own
    two stylesheets — the sitewide one and the page's own. Both are small once compressed (the
    sitewide one is ~34 KB raw but ~6 KB gzipped); what they cost is not bytes but a round trip
    the browser has to finish before it can paint anything.

    The trade this makes: an external stylesheet is content-hashed and cached `immutable` for a
    year, so a returning visitor pays nothing for it, while inlined CSS is re-sent with every
    page. That is the right way round for this site specifically — almost every visitor is
    arriving for the first time, from a search result or a shared link, and will read one or two
    pages. A first paint that doesn't wait on a round trip is worth more to them than a cache
    they will never use again.

    Only the blocking <link rel="stylesheet"> tags are touched. The preload/swap link for
    swiper.css is deliberately left alone: it is already non-blocking, and on pages without an
    image carousel Swiper isn't needed until the visitor scrolls.

    Runs after build:css (so it sees purged, minified CSS) and before build:cachebust, which
    then has nothing left to rewrite in these pages for the inlined files.
*/

const DIST = path.join(__dirname, '..', 'dist');

// Matches only the blocking tags this build emits, not the preload/swap link.
const STYLESHEET_LINK = /<link rel="stylesheet" type="text\/css" href="\/css\/([^"]+\.css)">/g;

function listHtmlFiles(dir, results = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            listHtmlFiles(full, results);
        } else if (entry.name.endsWith('.html')) {
            results.push(full);
        }
    }
    return results;
}

function run() {
    const cssCache = new Map();
    const readCss = (name) => {
        if (!cssCache.has(name)) {
            cssCache.set(name, fs.readFileSync(path.join(DIST, 'css', name), 'utf8').trim());
        }
        return cssCache.get(name);
    };

    let pages = 0;
    let inlined = 0;

    for (const file of listHtmlFiles(DIST)) {
        const html = fs.readFileSync(file, 'utf8');
        const names = [...html.matchAll(STYLESHEET_LINK)].map((match) => match[1]);
        if (names.length === 0) {
            continue;
        }

        // Concatenate in the order the links appeared, so the cascade is unchanged, and put the
        // <style> where the first link was for the same reason.
        const style = `<style>${names.map(readCss).join('')}</style>`;
        let first = true;
        const updated = html.replace(STYLESHEET_LINK, () => {
            if (first) {
                first = false;
                return style;
            }
            return '';
        });

        fs.writeFileSync(file, updated);
        pages += 1;
        inlined += names.length;
    }

    console.log(`[inline-css] Inlined ${inlined} stylesheet reference(s) into ${pages} page(s).`);
}

run();
