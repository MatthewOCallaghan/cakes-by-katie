const BASE_URL = "https://www.cakesbykatie.co.uk";

// Generated from collections.all rather than hand-maintained, so it stays correct as pages
// (e.g. the per-venue wedding pages) are added or removed.
//
// A page opts out by setting `eleventyExcludeFromCollections: true` in its front matter, which
// keeps the opt-out next to the page rather than as a filter list here. See src/pages/404.njk.
module.exports = class {
    data() {
        return {
            permalink: "/sitemap.xml",
            eleventyExcludeFromCollections: true,
        };
    }

    render(data) {
        const urls = data.collections.all
            .map((item) => {
                const cleanPath = item.url.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
                return `    <url>\n        <loc>${BASE_URL}${cleanPath}</loc>\n    </url>`;
            })
            .join("\n");

        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
    }
};
