// Page metadata for the generated wedding venue pages. Every field follows a fixed pattern
// around the venue's name, which is why these were worth generating rather than writing out 24
// times by hand.
//
// `shortName` is the only knob a venue has over its own copy — Old Gore by Yard Space is
// referred to as "Old Gore" in its heading and body, but the <title> keeps the full name so the
// page is findable under it.
const displayName = ({ weddingVenues, venueKey }) => {
    const venue = weddingVenues[venueKey];
    return venue.shortName || venue.name;
};

module.exports = {
    eleventyComputed: {
        title: (data) => `Wedding cakes delivered to ${data.weddingVenues[data.venueKey].name} | Cakes by Katie`,
        description: (data) =>
            `Delivering to ${displayName(data)}, Cakes by Katie offers bespoke wedding cakes and edible wedding favours ` +
            `in a wide range of flavours and catering for specific dietary requirements.`,
        heading: (data) => ({
            beforeText: "Wedding cakes for",
            text: displayName(data),
            afterText: data.weddingVenues[data.venueKey].location,
            image: { path: "backgrounds/wedding", alt: "Wedding background" },
        }),
        cta: (data) => ({
            text: `Let's talk about your wedding at ${displayName(data)}!`,
            image: { path: "backgrounds/wedding", alt: "Wedding background" },
        }),
        occasion: () => "wedding",
    },
};
