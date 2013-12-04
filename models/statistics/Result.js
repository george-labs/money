var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var resultPrint = {
    SuperHero: { title: 'Super Hero', total: '0', rel: '0.0'},
    Nonbeliever: { title: 'Nonbeliever', total: '0', rel: '0.0'},
    JollyJoker: { title: 'Jolly Joker', total: '0', rel: '0.0'},
    SmartCookie: { title: 'Smart Cookie', total: '0', rel: '0.0'},
    BeanCounter: { title: 'Bean Counter', total: '0', rel: '0.0'}
};

var resultSchema = Schema({
    persona: { type: String, enum: Object.keys(resultPrint), required: true }
    , total: Number
});

/**
 * Adds the statistical data for the given result/persona.
 * Usage example: statsResult.add({persona: 'JollyJoker', increment: 7});
 *
 * @param {Object} data \{ {String} persona, {Number} increment \} information on what to be updated
 * @param {function} callback Callback function
 */
resultSchema.statics.adjustTotal = function(data, callback) {
    this.findOne({persona: data.persona}).exec(function(err, toBeUpdated) {
        if (err) return callback(err);
        if (toBeUpdated === null) {
            toBeUpdated = new Result({persona: data.persona, total: 0});
        }
        toBeUpdated.total += data.increment;
        toBeUpdated.save(callback);
    });
};

/**
 * Retrieves the statistical data for synchronizing purposes.
 *
 * @param {function} callback Callback function
 */
resultSchema.statics.retrieve = function(callback) {
    this.find().exec(function(err, results) {
        var aggregatedResult = {};
        if (!err) {
            results.forEach(function(result) {
                aggregatedResult[result.persona] = result.total;
            });
        };
        callback(err, aggregatedResult);
    });
};

/**
 * Retrieves the statistical data for calculating purposes.
 * Ensures minimum threshold
 *
 * @param {function} callback Callback function
 */
resultSchema.statics.retrieveDistribution = function(callback) {
    this.find().exec(function(err, results) {
        var sum = 0,
            beautifiedResult = {},
            personas = Object.keys(resultPrint);
        personas.forEach(function(persona) {
            beautifiedResult[persona] = 0;
        });
        if (!err) {
            results.forEach(function(result) {
                beautifiedResult[result.persona] = result.total;
                sum += result.total;
            });
        }
        if (sum < 500) {
            // minimum threshold to ensure that early stages of app usage
            sum = 0;
            personas.forEach(function(persona) {
                var fake = 100 + Math.floor(Math.random() * 30);
                beautifiedResult[persona] = fake;
                sum += fake;
            });
        }
        personas.forEach(function(persona) {
            var adjust = beautifiedResult[persona];
            adjust = Math.round(adjust / sum * 100);
            // make sure percentage is never 100 or 0 (due to "you are not alone")
            adjust = Math.max(1, adjust);
            adjust = Math.min(99, adjust);
            beautifiedResult[persona] = adjust;
        });
        callback(err, beautifiedResult);
    });
};

/**
 * Retrieves the statistical data for displaying purposes.
 *
 * @param {function} callback Callback function
 */
resultSchema.statics.prettyPrint = function(callback) {
    this.find().exec(function(err, units) {
        if (err) return callback(err, resultPrint);
        var sum = 0;
        units.forEach(function(unit) {
            sum += unit.total;
            resultPrint[unit.persona].total = unit.total.toString(10).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        });
        Object.keys(resultPrint).forEach(function(key) {
            var percentage = Math.round(resultPrint[key].total / sum * 1000) / 10;
            resultPrint[key].rel = sum === 0 ? '-' : percentage.toString(10) + (parseInt(percentage, 10) === percentage ? '.0' : '');
        });
        callback(err, resultPrint);
    });
};

var Result = mongoose.model('StatsResult', resultSchema);