const { FORMATS } = require("../../utils/images");

module.exports = () => ({
    formats: FORMATS,
    defaultFormat: FORMATS[FORMATS.length - 1]
});
