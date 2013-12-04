var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var centralSchema = Schema({
    type: { type: String, required: true }
    , rawDump: { type: Schema.Types.Mixed, required: true }
});

/**
 * Adds the statistical data for the given referer.
 * Usage example: statsReferer.add({referer: '(undefined)', increment: 1});
 *
 * @param {Object} data \{ {String} type, {Object} raw \} information on what to be updated
 * @param {function} callback Callback function
 */
centralSchema.statics.insertOrUpdate = function(data, callback) {
    this.findOne({type: data.key}, function(err, toBeUpdated) {
        if (err) return callback(err);
        if (toBeUpdated === null) {
            toBeUpdated = new Central({type: data.key});
        }
        toBeUpdated.rawDump = data.value;
        toBeUpdated.save(callback);
    });
};

/**
 * Retrieves the statistical data for displaying purposes.
 *
 * @param {function} callback Callback function
 */
centralSchema.statics.prettyPrint = function(callback) {
    this.find().exec(function(err, allSynced) {
        var dump = undefined;
        if (err || allSynced.length === 0) return callback(err, dump);
        dump = {};
        allSynced.forEach(function(synced) {
            var data = synced.rawDump;
            if (synced.type === 'result') {
                var format = function (types) {
                    var sum = 0,
                        print = {
                            SuperHero: { total: '0', rel: '0.0'},
                            Nonbeliever: {  total: '0', rel: '0.0'},
                            JollyJoker: { total: '0', rel: '0.0'},
                            SmartCookie: { total: '0', rel: '0.0'},
                            BeanCounter: { total: '0', rel: '0.0'}
                        };
                    Object.keys(types).forEach(function(key) {
                        sum += types[key];
                        print[key].total = ('' + types[key]).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    });
                    Object.keys(types).forEach(function(key) {
                        var percentage = Math.round(types[key] / sum * 1000) / 10;
                        print[key].rel = sum === 0 ? '-' : percentage.toString(10) + (parseInt(percentage, 10) === percentage ? '.0' : '');
                    });
                    return print;
                };
                dump.result = { persona: format(data.total), country: [] };
                Object.keys(data.perCountry || []).forEach(function(countryCode) {
                    dump.result.country.push({ title: countryCode, persona: format(data.perCountry[countryCode]) });
                });
            }
        });
        callback(err, dump);
    });
};

var Central = mongoose.model('StatsCentral', centralSchema);