const fs = require("fs");
const path = require("path");

const SCSS_DIR = path.join(__dirname, "../scss");

// The page's own stylesheet, if it has one. Pages used to declare `hasCSSFile: true` in the
// metadata registry — thirteen booleans that had to be kept in step with the thirteen files in
// src/scss. It's the same question as "does that file exist", so ask that instead: adding
// src/scss/<slug>.scss is now all it takes for a page to pick up its own stylesheet.
//
// The slug is the page's filename, or its directory when the file is an index — so
// occasions/index.njk looks for occasions.scss, matching the names already in use.
const stylesheetSlug = (filePathStem) => {
    const parts = filePathStem.split("/").filter(Boolean);
    const name = parts.pop();
    return name === "index" && parts.length ? parts.pop() : name;
};

module.exports = {
    permalink: "{{ page.filePathStem }}.html",
    eleventyComputed: {
        pageStylesheet: ({ page }) => {
            const slug = stylesheetSlug(page.filePathStem);
            return slug && fs.existsSync(path.join(SCSS_DIR, `${slug}.scss`)) ? slug : null;
        },
    },
};
