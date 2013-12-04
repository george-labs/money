var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var userAgentPrint = {
    limit: 50,
    top: []
};

var userAgentSchema = Schema({
    userAgent: { type: String, required: true }
    , total: Number
});

/**
 * Adds the statistical data for the given user agent.
 * Usage example: statsUserAgent.add({userAgent: '(undefined)', increment: 1});
 *
 * @param {Object} data \{ {String} userAgent, {Number} increment \} information on what to be updated
 * @param {function} callback Callback function
 */
userAgentSchema.statics.adjustTotal = function(data, callback) {
    this.findOne({userAgent: data.userAgent}).exec(function(err, toBeUpdated) {
        if (err) return callback(err);
        if (toBeUpdated === null) {
            toBeUpdated = new UserAgent({userAgent: data.userAgent, total: 0});
        }
        toBeUpdated.total += data.increment;
        toBeUpdated.save(callback);
    });
};

/**
 * Retrieves the statistical data for displaying purposes.
 *
 * @param {function} callback Callback function
 */
userAgentSchema.statics.prettyPrint = function(callback) {
    this.find().sort({total: 'DESC'}).limit(userAgentPrint.limit).exec(function(err, units) {
        if (err) return callback(err, userAgentPrint);
        userAgentPrint.top = [];
        units.forEach(function(unit) {
            userAgentPrint.top.push({ value: unit.userAgent, total: unit.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') });
        });
        callback(err, userAgentPrint);
    });
};

var UserAgent = mongoose.model('StatsUserAgent', userAgentSchema);