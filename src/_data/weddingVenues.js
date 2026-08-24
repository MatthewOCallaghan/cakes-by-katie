const venues = require("./venues");

// The subset of venues that get their own wedding page, in venues.json order. Used both to
// generate those pages (src/pages/delivery/venue.njk paginates over this) and to list them
// (src/_includes/wedding-venues.njk), so the two can't disagree.
//
// Downe House School is in venues.json but isn't a wedding venue — it has its own hand-written
// page about birthday cake delivery to the school.
// Sorted alphabetically by display name, ignoring a leading "The" so The Retreat at Elcot Park
// files under R rather than clustering with the other two venues whose names start with "The".
//
// The previous order was an artifact of the order the page-metadata entries happened to be
// written in — roughly alphabetical for the first fifteen venues, then whatever was appended
// after that. Worth a look: if these should lead with particular venues rather than run
// alphabetically, this is now the one place to say so.
const sortName = (venue) => venue.name.replace(/^The\s+/i, "");

module.exports = () =>
    Object.fromEntries(
        Object.entries(venues())
            .filter(([, venue]) => venue.occasion === "wedding")
            .sort(([, a], [, b]) => sortName(a).localeCompare(sortName(b)))
    );
