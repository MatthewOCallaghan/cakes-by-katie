const { BASE_URL } = require('../../utils/urls');

// https://llmstxt.org/
const CONTACT = [
    'Email: katie@cakesbykatie.co.uk',
    'Phone / WhatsApp: 07436120654',
    'Instagram: @cakesbykatieoc',
    'Facebook: @cakesbykatieoc',
];

const link = ({ href, label, summary }) => `- [${label}](${BASE_URL}${href})${summary ? `: ${summary}` : ''}`;

module.exports = class {
    data() {
        return {
            permalink: '/llms.txt',
            eleventyExcludeFromCollections: true,
        };
    }

    render({ navigation }) {
        const about = [...navigation.quickLinks.filter((item) => item.summary), ...navigation.legal];

        return [
            '# Cakes by Katie',
            '',
            '> Bespoke wedding cakes, celebration cakes, and cupcakes handmade by Katie in Thatcham, West Berkshire, UK (near Newbury and Reading).',
            '',
            '## About',
            '',
            ...about.map(link),
            '',
            '## Products',
            '',
            ...navigation.listedProducts.map(link),
            '',
            '## Portfolio',
            '',
            link({
                href: '/portfolio',
                label: 'Portfolio',
                summary:
                    'Gallery of past cakes made for weddings, birthdays, anniversaries, christenings, corporate events and other occasions.',
            }),
            '',
            '## Contact',
            '',
            ...CONTACT.map((line) => `- ${line}`),
            '',
        ].join('\n');
    }
};
