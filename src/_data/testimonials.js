const computePortfolio = require('../../scripts/portfolio-data');

// Collect testimonials separately to make them easier to process
module.exports = async () => {
    const portfolio = await computePortfolio();
    return Object.entries(portfolio).reduce(
        (acc, [cake, { testimonial }]) => (testimonial ? acc.concat({ cake, ...testimonial }) : acc),
        []
    );
};
