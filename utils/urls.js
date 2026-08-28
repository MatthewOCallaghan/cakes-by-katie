// The site's canonical origin. Lives here rather than in three copies: the sitemap, llms.txt
// and the canonical link tag all have to agree, or search engines see the same page under
// several addresses.
const BASE_URL = 'https://www.cakesbykatie.co.uk';

// Pages are built to `<name>.html` (see src/pages/pages.11tydata.js) but served extensionless,
// so every page is reachable at two addresses. This normalises to the one we publish — the same
// rule the sitemap has always applied, now shared so a canonical tag cannot disagree with it.
const canonicalPath = (url) => url.replace(/\/index\.html$/, '/').replace(/\.html$/, '');

const canonicalUrl = (url) => `${BASE_URL}${canonicalPath(url)}`;

// Absolute URL for a root-relative asset path. Open Graph and Twitter Card tags are read by
// crawlers with no page context, so they can't take a relative href.
const absoluteUrl = (path) => `${BASE_URL}${path}`;

module.exports = { BASE_URL, canonicalPath, canonicalUrl, absoluteUrl };
