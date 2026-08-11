const fs = require("fs");
const path = require("path");
const flavourGroups = require("./flavourGroups.json");

const VENUES_JSON = path.join(__dirname, "../content/venues.json");

// Inject flavour names into venue flavour tips
module.exports = () => {
    const venues = JSON.parse(fs.readFileSync(VENUES_JSON, "utf8"));

    for (const venueKey in venues) {
        const venue = venues[venueKey];
        if (venue.flavourTip) {
            const { text, flavourGroups: groupKeys } = venue.flavourTip;
            venue.flavourTip = text.replace(/%/g, () => `<span class="flavour">${flavourGroups[groupKeys.shift()].name}</span>`);
        }
    }

    return venues;
};
