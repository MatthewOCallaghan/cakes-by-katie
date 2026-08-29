const { BASE_URL, canonicalPath, canonicalUrl } = require('./urls');

// Page titles carry the site name ("Wedding cakes | Cakes by Katie"); a breadcrumb wants just
// the page's own part.
const shortTitle = (title, siteName) => (title || '').split(` | ${siteName}`)[0];

/*
    BreadcrumbList items for a page, or [] for a page that doesn't need one.

    The site is two levels deep — /products/wedding-cakes, /occasions/christmas,
    /delivery/wasing-park — and each of those sections has an index page. Rather than maintain a
    parallel map of section names, find the section's own index in the collection and use its
    title, so a renamed section stays correct here for free.
*/
const breadcrumbTrail = (pageUrl, allPages, siteName) => {
    const segments = canonicalPath(pageUrl).split('/').filter(Boolean);

    // Top-level pages are their own first level; Google asks for no breadcrumb there.
    if (segments.length < 2) {
        return [];
    }

    const sectionPath = `/${segments[0]}/`;
    const section = allPages.find((item) => canonicalPath(item.url) === sectionPath);
    const page = allPages.find((item) => item.url === pageUrl);

    return [
        { name: 'Home', url: `${BASE_URL}/` },
        ...(section ? [{ name: shortTitle(section.data.title, siteName), url: `${BASE_URL}${sectionPath}` }] : []),
        { name: shortTitle(page && page.data.title, siteName), url: canonicalUrl(pageUrl) },
    ];
};

module.exports = { breadcrumbTrail };
