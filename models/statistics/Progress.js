var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var progressPrint = {
    'welcome': { title: 'Landing page', total: '0', rel: '0.0'},
    'get-ready': { title: 'Introduction', total: '0', rel: '0.0'},
    'question-1-intro': { title: 'Question 1 Intro', total: '0', rel: '0.0'},
    'question-1': { title: 'Question 1', total: '0', rel: '0.0'},
    'question-2-intro': { title: 'Question 2 Intro', total: '0', rel: '0.0'},
    'question-2': { title: 'Question 2', total: '0', rel: '0.0'},
    'question-3-intro': { title: 'Question 3 Intro', total: '0', rel: '0.0'},
    'question-3': { title: 'Question 3', total: '0', rel: '0.0'},
    'question-4-intro': { title: 'Question 4 Intro', total: '0', rel: '0.0'},
    'question-4': { title: 'Question 4', total: '0', rel: '0.0'},
    'question-5-intro': { title: 'Question 5 Intro', total: '0', rel: '0.0'},
    'question-5': { title: 'Question 5', total: '0', rel: '0.0'},
    'question-6-intro': { title: 'Question 6 Intro', total: '0', rel: '0.0'},
    'question-6': { title: 'Question 6', total: '0', rel: '0.0'},
    'question-7-intro': { title: 'Question 7 Intro', total: '0', rel: '0.0'},
    'question-7': { title: 'Question 7', total: '0', rel: '0.0'},
    'question-8-intro': { title: 'Question 8 Intro', total: '0', rel: '0.0'},
    'question-8': { title: 'Question 8', total: '0', rel: '0.0'},
    'calculation': { title: 'Calculation', total: '0', rel: '0.0'},
    'result': { title: 'Result', total: '0', rel: '0.0'},
    'error': { title: 'Error page', total: '0', rel: '0.0'}
};

var progressSchema = Schema({
    progress: { type: String, enum: Object.keys(progressPrint), required: true }
    , total: Number
});

/**
 * Adds the statistical data for the given progress-tracker.
 * Usage example: statsProgress.add({referer: 'welcome', increment: 3});
 *
 * @param {Object} data \{ {String} progress, {Number} increment \} information on what to be updated
 * @param {function} callback Callback function
 */
progressSchema.statics.adjustTotal = function(data, callback) {
    this.findOne({progress: data.progress}).exec(function(err, toBeUpdated) {
        if (err) return callback(err);
        if (toBeUpdated === null) {
            toBeUpdated = new Progress({progress: data.progress, total: 0});
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
progressSchema.statics.prettyPrint = function(callback) {
    this.find().exec(function(err, units) {
        if (err) return callback(err, progressPrint);
        var sum = 0;
        units.forEach(function(unit) {
            sum += unit.total;
            progressPrint[unit.progress].total = unit.total.toString(10).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        });
        Object.keys(progressPrint).forEach(function(key) {
            var percentage = Math.round(progressPrint[key].total / sum * 1000) / 10;
            progressPrint[key].rel = sum === 0 ? '-' : percentage.toString(10) + (parseInt(percentage, 10) === percentage ? '.0' : '');
        });
        callback(err, progressPrint);
    });
};

var Progress = mongoose.model('StatsProgress', progressSchema);