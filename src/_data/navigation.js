const products = require("./products.json");

// The one description of the site's own structure.
//
// It previously existed in four hand-maintained copies that had to be kept in step: the header
// submenus and the footer link lists in layout.njk, the tile grids written inline in
// products/index.njk and occasions/index.njk, and src/llms.txt. Everything here is consumed by
// all four.
//
// Per item:
//   href, label     the link itself
//   thumb           50px image in the header submenu — either a portfolio key (whose squareImage
//                   is used) or an explicit path under images/
//   thumbAlt        alt text for that thumbnail
//   tile            the larger card on the section's own index page: cake-cutout image, alt, and
//                   background
//   summary         one line for llms.txt; omitted items are listed there without one
//   listed          false keeps an item out of every menu, footer list, tile grid and llms.txt
//                   while leaving its page in place (it was previously commented out in three
//                   places and still shipped)
const gradient = (product) => `linear-gradient(135deg, ${product.colours.dark}, ${product.colours.light})`;

const productLinks = [
    {
        href: "/products/wedding-cakes",
        label: "Wedding cakes",
        thumb: { cake: "kirsten-buttercream" },
        thumbAlt: "Wedding cake",
        tile: { title: "Wedding Cakes", image: "cake-cutouts/wedding", alt: "Wedding cake", colour: gradient(products.weddingCakes) },
    },
    {
        href: "/products/celebration-cakes",
        label: "Celebration cakes",
        thumb: { cake: "parker-penguin" },
        thumbAlt: "Birthday cake",
        tile: {
            title: "Celebration Cakes",
            image: "cake-cutouts/parker-penguin",
            alt: "Parker penguin birthday cake",
            colour: gradient(products.celebrationCakes),
        },
    },
    {
        href: "/products/cupcakes",
        label: "Cupcakes",
        thumb: { cake: "rose-mix" },
        thumbAlt: "Cupcakes",
        tile: { title: "Cupcakes", image: "cake-cutouts/rose-mix-triple", alt: "Rose mix cupcakes", colour: gradient(products.cupcakes) },
    },
    {
        href: "/products/wedding-favours",
        label: "Wedding favours",
        thumb: { image: "wedding-favours/cake-jar-square" },
        thumbAlt: "Christening cake",
        tile: {
            title: "Wedding favours",
            image: "wedding-favours/cake-jar-cutout",
            alt: "Cake jar wedding favour",
            colour: gradient(products.weddingFavours),
        },
    },
];

const occasionLinks = [
    {
        href: "/occasions/wedding",
        label: "Wedding",
        thumb: { image: "portfolio/square/Charlotte-zoomed-square" },
        thumbAlt: "Wedding cake",
        tile: { title: "Wedding", image: "cake-cutouts/wedding", alt: "Wedding cake", colour: "var(--colour-purple-dark)" },
    },
    {
        href: "/occasions/birthday",
        label: "Birthday",
        thumb: { cake: "parker-penguin" },
        thumbAlt: "Birthday cake",
        tile: {
            title: "Birthday",
            image: "cake-cutouts/parker-penguin",
            alt: "Parker penguin birthday cake",
            colour: "var(--colour-blue-mid)",
        },
    },
    {
        href: "/occasions/anniversary",
        label: "Anniversary",
        thumb: { cake: "diamond-toast" },
        thumbAlt: "Anniversary cake",
        tile: {
            title: "Anniversary",
            image: "cake-cutouts/anniversary-cake",
            alt: "Anniversary cake",
            colour: "var(--colour-pink-dark)",
        },
    },
    {
        href: "/occasions/christening",
        label: "Christening",
        thumb: { cake: "dreamland-express" },
        thumbAlt: "Christening cake",
        tile: {
            title: "Christening",
            image: "cake-cutouts/christening-cake",
            alt: "Christening cake",
            colour: "var(--colour-orange-dark)",
        },
    },
    {
        href: "/occasions/baby-shower",
        label: "Baby shower",
        thumb: { cake: "fishing-for-dreams" },
        thumbAlt: "Baby shower cake",
        tile: {
            title: "Baby shower",
            image: "cake-cutouts/fishing-for-dreams",
            alt: "Baby shower cake",
            colour: "var(--colour-turquoise-dark)",
        },
    },
    {
        href: "/occasions/gender-reveal",
        label: "Gender reveal",
        thumb: { cake: "baby-bears" },
        thumbAlt: "Gender reveal cake",
        tile: {
            title: "Gender reveal",
            image: "cake-cutouts/baby-bears",
            alt: "Gender reveal cake",
            colour: "var(--colour-yellow-dark)",
        },
    },
    {
        href: "/occasions/corporate",
        label: "Corporate",
        thumb: { cake: "corporate-thank-you" },
        thumbAlt: "Corporate cake",
        tile: {
            title: "Corporate",
            image: "cake-cutouts/corporate-cupcakes",
            alt: "Corporate cupcakes",
            colour: "var(--colour-green-dark)",
        },
    },
    {
        href: "/occasions/valentines",
        label: "Valentine's",
        thumb: { cake: "be-my-valentine" },
        thumbAlt: "Valentine's cake",
        tile: {
            title: "Valentine's",
            image: "cake-cutouts/valentines-cake",
            alt: "Valentine's cake",
            colour: "var(--colour-pink-bright)",
        },
    },
    {
        href: "/occasions/easter",
        label: "Easter",
        thumb: { cake: "blue-speckle-mini-eggs" },
        thumbAlt: "Easter cake",
        tile: { title: "Easter", image: "cake-cutouts/easter-cake", alt: "Easter cake", colour: "var(--colour-blue-dark)" },
    },
    {
        href: "/occasions/christmas",
        label: "Christmas",
        thumb: { cake: "ruby-reindeer" },
        thumbAlt: "Christmas cake",
        tile: { title: "Christmas", image: "cake-cutouts/ruby-reindeer", alt: "Christmas cake", colour: "var(--colour-red-dark)" },
    },
];

// The "About" submenu in the header. The footer's Quick links are these plus Home, Contact and
// Portfolio, which sit at the top level of the header rather than in a submenu.
const aboutLinks = [
    { href: "/about", label: "Meet Katie", footerLabel: "About", summary: "Meet Katie, the baker and decorator behind Cakes by Katie." },
    { href: "/pricing", label: "Pricing", summary: "Pricing guide for wedding cakes, celebration cakes, and cupcakes." },
    { href: "/flavours", label: "Flavours", summary: "Available cake flavours, including gluten-free, dairy-free, and vegan options." },
    { href: "/testimonials", label: "Testimonials", summary: "Customer reviews and testimonials." },
    { href: "/delivery", label: "Delivery", summary: "Delivery information and wedding venues served." },
    { href: "/awards", label: "News & Awards", footerLabel: "News & Awards", summary: "News and awards received." },
    { href: "/faqs", label: "FAQs", summary: "Frequently asked questions." },
];

const listed = (links) => links.filter((link) => link.listed !== false);

module.exports = {
    products: productLinks,
    // Not in any menu, but llms.txt lists it and the footer links it from the copyright line.
    legal: [{ href: "/terms", label: "Terms and Conditions", summary: "Terms and conditions for placing an order." }],
    occasions: occasionLinks,
    about: aboutLinks,
    listedProducts: listed(productLinks),
    listedOccasions: listed(occasionLinks),

    // Quick links in the footer, in the order they've always been in.
    quickLinks: [
        { href: "/", label: "Home", summary: "Overview and introduction to Cakes by Katie." },
        { href: "/about", label: "About", summary: "Meet Katie, the baker and decorator behind Cakes by Katie." },
        { href: "#contact", label: "Contact", contact: true },
        { href: "/portfolio", label: "Portfolio" },
        ...listed(aboutLinks)
            .filter((link) => link.href !== "/about")
            .map((link) => ({ ...link, label: link.footerLabel || link.label })),
    ],
};
