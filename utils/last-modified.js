const { execFileSync } = require('child_process');

// Last commit date for a file, as an ISO 8601 string, or null when git can't answer.
//
// The build machine is the only place that knows this: a fresh clone gives every file the same
// mtime, so file timestamps would stamp every page with the build time. Google discounts
// lastmod when it isn't consistently accurate, and "every page changed today, every deploy" is
// exactly that case — so when git can't date a file (a shallow clone, an untracked file, no
// repository at all) this returns null and the caller omits lastmod rather than inventing one.
const lastModified = (filePath) => {
    try {
        const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        return date || null;
    } catch {
        return null;
    }
};

module.exports = { lastModified };
