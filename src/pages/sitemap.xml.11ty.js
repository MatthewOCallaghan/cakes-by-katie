const BASE_URL = "https://www.cakesbykatie.co.uk";

// Generated from collections.all rather than hand-maintained, so it stays correct as pages
// (e.g. the per-venue wedding pages) are added or removed.
module.exports = class {
    data() {
        return {
            permalink: "/sitemap.xml",
            eleventyExcludeFromCollections: true,
        };
    }

    render(data) {
        const urls = data.collections.all
            .filter((item) => item.url !== "/404.html")
            .map((item) => {
                const cleanPath = item.url.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
                return `    <url>\n        <loc>${BASE_URL}${cleanPath}</loc>\n    </url>`;
            })
            .join("\n");

        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
    }
};
