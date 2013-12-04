var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var clickPrint = {
    pageAbout: { title: 'Page "About"', total: '0'},
    pageImprint: { title: 'Page "Imprint"', total: '0'},
    pageDisclaimer: { title: 'Page "Disclaimer"', total: '0'},
    pageSitemap: { title: 'Page "Sitemap"', total: '0'},
    shareOnFacebook: { title: 'Share on facebook', total: '0'},
    shareOnGooglePlus: { title: 'Share on google+', total: '0'},
    shareOnTwitter: { title: 'Share on twitter', total: '0'},
    whatToDoNext: { title: 'What to do next', total: '0'}
};

var clickSchema = Schema({
    target: { type: String, enum: Object.keys(clickPrint), required: true }
    , total: Number
});

/**
 * Adds the statistical data for the given target.
 * Usage example: statsClick.add({target: 'shareOnTwitter', increment: 7});
 *
 * @param {Object} data \{ {String} target, {Number} increment \} information on what to be updated
 * @param {function} callback Callback function
 */
clickSchema.statics.adjustTotal = function(data, callback) {
    this.findOne({target: data.target}).exec(function(err, toBeUpdated) {
        if (err) return callback(err);
        if (toBeUpdated === null) {
            toBeUpdated = new Click({target: data.target, total: 0});
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
clickSchema.statics.prettyPrint = function(callback) {
    this.find().exec(function(err, units) {
        if (err) return callback(err, clickPrint);
        units.forEach(function(unit) {
            clickPrint[unit.target].total = unit.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        });
        callback(err, clickPrint);
    });
};

var Click = mongoose.model('StatsClick', clickSchema);