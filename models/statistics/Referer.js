var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var refererPrint = {
    limit: 50,
    top: []
};

var refererSchema = Schema({
    referer: { type: String, required: true }
    , total: Number
});

/**
 * Adds the statistical data for the given referer.
 * Usage example: statsReferer.add({referer: '(undefined)', increment: 1});
 *
 * @param {Object} data \{ {String} referer, {Number} increment \} information on what to be updated
 * @param {function} callback Callback function
 */
refererSchema.statics.adjustTotal = function(data, callback) {
    this.findOne({referer: data.referer}).exec(function(err, toBeUpdated) {
        if (err) return callback(err);
        if (toBeUpdated === null) {
            toBeUpdated = new Referer({referer: data.referer, total: 0});
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
refererSchema.statics.prettyPrint = function(callback) {
    this.find().sort({total: 'DESC'}).limit(refererPrint.limit).exec(function(err, units) {
        if (err) return callback(err, refererPrint);
        refererPrint.top = [];
        units.forEach(function(unit) {
            refererPrint.top.push({ value: unit.referer, total: unit.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') });
        });
        callback(err, refererPrint);
    });
};

var Referer = mongoose.model('StatsReferer', refererSchema);