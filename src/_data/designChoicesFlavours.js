const flavours = require("./flavours.json");

// Flavours entry for design-choices macro
module.exports = () => ({
    name: "Flavours",
    items: Object.values(flavours).map(({ name, variants }) => ({ name, image: variants[0].image })),
    seeMoreLink: "/flavours"
});
