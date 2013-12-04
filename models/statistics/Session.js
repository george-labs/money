var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var sessionSchema = new Schema({
    sessionId: { type: String, required: true }
    , createdAt: { type: Date, required: true, default: Date.now }
    , userAgent: String
    , referer: String
    , progress: { type: String, enum: ['welcome', 'get-ready', 'question-1-intro', 'question-1', 'question-2-intro', 'question-2', 'question-3-intro', 'question-3', 'question-4-intro', 'question-4', 'question-5-intro', 'question-5', 'question-6-intro', 'question-6', 'question-7-intro', 'question-7', 'question-8-intro', 'question-8', 'calculation', 'result', 'error'], default: 'welcome', required: true }
    , persona: { type: String, enum: ['SuperHero', 'Nonbeliever', 'JollyJoker', 'SmartCookie', 'BeanCounter'] }
    , clicked: [String] // array with 0..n String values from target enum (see Click.js schema for details)
});

/**
 * Updates the statistical data for the current session.
 *
 * @param {Object} req request containing the session ID
 * @param {Object} data the key/values to be updated
 * @param {function} callback Callback function
 */
sessionSchema.statics.syncCurrent = function(req, data, callback) {
    var sid = req.sessionID,
        data = data || {};
    this.findOne({sessionId: sid}).exec(function(err, currentSession) {
        if (err) return callback(err);
        if (currentSession === null) {
            currentSession = new Session({sessionId: sid});
            currentSession.userAgent = req.headers['user-agent'];
            currentSession.referer = req.headers['referer'];
        }
        var dataKeys = Object.keys(data),
            i = dataKeys.length;
        while (--i >= 0) {
            var key = dataKeys[i],
                value = data[key];
            if (key === 'progress' && Session.schema.path('progress').enumValues.indexOf(value) === -1) {
                key = 'clicked';
                value = 'page' + value[0].toUpperCase() + value.slice(1);
            }
            if (key === 'clicked' && typeof value === 'string') {
                if (currentSession.clicked.indexOf(value) === -1) {
                    currentSession.clicked.push(value);
                }
            } else {
                currentSession[key] = value;
            }
        }
        currentSession.save(callback);
    });
};

/**
 * Get sessions who are declared expired.
 *
 * @param {function} callback Callback function
 */
sessionSchema.statics.getExpired = function(callback) {
    var dtCut = new Date(new Date() - 43200000 /* 12 hours (8 * 60 * 60 * 1000) */);
    this.find({createdAt: { $lt: dtCut }}).exec(callback);
};

/**
 * Retrieves the statistical data for displaying purposes.
 *
 * @param {function} callback Callback function
 */
sessionSchema.statics.prettyPrint = function(callback) {
    Session.count({}, function(err, count) {
        callback(err, { activeSessions: count });
    });
};

var Session = mongoose.model('StatsSession', sessionSchema);

