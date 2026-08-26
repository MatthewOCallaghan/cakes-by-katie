const venues = require("./venues");

// The subset of venues that get their own wedding page, in venues.json order. Used both to
// generate those pages (src/pages/delivery/venue.njk paginates over this) and to list them
// (src/_includes/wedding-venues.njk), so the two can't disagree.
//
// Downe House School is in venues.json but isn't a wedding venue — it has its own hand-written
// page about birthday cake delivery to the school.
// Sorted alphabetically by display name, ignoring a leading "The" so The Retreat at Elcot Park
// files under R rather than clustering with the other two venues whose names start with "The".
const sortName = (venue) => venue.name.replace(/^The\s+/i, "");

module.exports = () =>
    Object.fromEntries(
        Object.entries(venues())
            .filter(([, venue]) => venue.occasion === "wedding")
            .sort(([, a], [, b]) => sortName(a).localeCompare(sortName(b)))
    );
