const fs = require("fs");
const path = require("path");

const PAGES_JSON = path.join(__dirname, "../content/pages.json");
const VENUES_JSON = path.join(__dirname, "../content/venues.json");

// Page metadata for every page on the site, keyed by the identifier a template declares with
// `{% set page = "..." %}`.
//
// Hand-written pages live in src/content/pages.json. The per-venue wedding pages are generated
// here instead, rendered from one paginated template (src/pages/delivery/venue.njk).

const venuePageKey = (venueKey) => `venue:${venueKey}`;

const buildVenuePage = (venue) => {

    // We use a shorted name for some venues (e.g. "Old Gore by Yard Space" => "Old Gore")
    const name = venue.shortName || venue.name;

    return {
        title: `Wedding cakes delivered to ${venue.name} | Cakes by Katie`,
        description:
            `Delivering to ${name}, Cakes by Katie offers bespoke wedding cakes and edible wedding favours ` +
            `in a wide range of flavours and catering for specific dietary requirements.`,
        heading: {
            beforeText: "Wedding cakes for",
            text: name,
            afterText: venue.location,
            image: { path: "backgrounds/wedding", alt: "Wedding background" },
        },
        cta: {
            text: `Let's talk about your wedding at ${name}!`,
            image: { path: "backgrounds/wedding", alt: "Wedding background" },
        },
        occasion: "wedding",
    };
};

module.exports = () => {
    const pages = JSON.parse(fs.readFileSync(PAGES_JSON, "utf8"));
    const venues = JSON.parse(fs.readFileSync(VENUES_JSON, "utf8"));

    for (const [venueKey, venue] of Object.entries(venues)) {
        if (venue.occasion === "wedding") {
            pages[venuePageKey(venueKey)] = { ...buildVenuePage(venue), venue: venueKey };
        }
    }

    return pages;
};

module.exports.venuePageKey = venuePageKey;
