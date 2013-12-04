var mongoose = require('mongoose')
    , async = require('async')
    , statsSession = mongoose.model('StatsSession')
    , statsReferer = mongoose.model('StatsReferer')
    , statsUserAgent = mongoose.model('StatsUserAgent')
    , statsProgress = mongoose.model('StatsProgress')
    , statsResult = mongoose.model('StatsResult')
    , statsClick = mongoose.model('StatsClick')
    , statsCentral = mongoose.model('StatsCentral');

module.exports = {

    aggregate: function (callback) {
        var container = {};
        async.parallel([
            function (callback) {
                statsSession.prettyPrint(function (err, result) {
                    container.session = result;
                    callback();
                });
            },
            function (callback) {
                statsProgress.prettyPrint(function (err, result) {
                    container.progress = result;
                    callback();
                });
            },
            function (callback) {
                statsResult.prettyPrint(function (err, result) {
                    container.result = result;
                    callback();
                });
            },
            function (callback) {
                statsClick.prettyPrint(function (err, result) {
                    container.click = result;
                    callback();
                });
            },
            function (callback) {
                statsReferer.prettyPrint(function (err, result) {
                    container.referer = result;
                    callback();
                });
            },
            function (callback) {
                statsUserAgent.prettyPrint(function (err, result) {
                    container.userAgent = result;
                    callback();
                });
            },
            function (callback) {
                statsCentral.prettyPrint(function (err, result) {
                    if (result) {
                        container.central = result;
                    }
                    callback();
                });
            }
        ], function(err, results) {
            callback(err, container);
        });
    }

};