const BASE_URL = "https://www.cakesbykatie.co.uk";

// Generated from src/_data/navigation.js rather than hand-maintained, so it can't drift from the
// site's actual menus the way the previous static src/llms.txt could. Only the prose and the
// contact details live here.
//
// https://llmstxt.org/
const CONTACT = [
    "Email: katie@cakesbykatie.co.uk",
    "Phone / WhatsApp: 07436120654",
    "Instagram: @cakesbykatieoc",
    "Facebook: @cakesbykatieoc",
];

const link = ({ href, label, summary }) => `- [${label}](${BASE_URL}${href})${summary ? `: ${summary}` : ""}`;

module.exports = class {
    data() {
        return {
            permalink: "/llms.txt",
            eleventyExcludeFromCollections: true,
        };
    }

    render({ navigation }) {
        const about = [...navigation.quickLinks.filter((item) => item.summary), ...navigation.legal];

        return [
            "# Cakes by Katie",
            "",
            "> Bespoke wedding cakes, celebration cakes, and cupcakes handmade by Katie in Thatcham, West Berkshire, UK (near Newbury and Reading).",
            "",
            "## About",
            "",
            ...about.map(link),
            "",
            "## Products",
            "",
            ...navigation.listedProducts.map(link),
            "",
            "## Portfolio",
            "",
            link({
                href: "/portfolio",
                label: "Portfolio",
                summary:
                    "Gallery of past cakes made for weddings, birthdays, anniversaries, christenings, corporate events and other occasions.",
            }),
            "",
            "## Contact",
            "",
            ...CONTACT.map((line) => `- ${line}`),
            "",
        ].join("\n");
    }
};
