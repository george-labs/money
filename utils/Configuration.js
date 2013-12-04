var CorporateIdentity = require('../utils/CorporateIdentity');

var config = {
    title: 'MONEY'
};

module.exports = {

    /**
     * set value for key
     * @param {String} key
     * @param {Object} value
     */
    set: function (key, value) {
        config[key] = value;
    },

    /**
     * render
     * @param {Object} req if specified, additional request specific data will be added to the returned configuration
     * @returns {Object} in-memory configuration data
     */
    render: function (req) {
        if (typeof req === 'object') {
            config.url = req.protocol + '://' + req.get('host') + '/';
            config.ci = CorporateIdentity.render(req);
        } else {
            delete config.ci;
        }
        return config;
    }

};