var mongoose = require('mongoose')
    , async = require('async')
    , http = require('http')
    , https = require('https')
    , querystring = require('querystring')
    , Configuration = require('../utils/Configuration')
    , statsSession = mongoose.model('StatsSession')
    , statsReferer = mongoose.model('StatsReferer')
    , statsUserAgent = mongoose.model('StatsUserAgent')
    , statsProgress = mongoose.model('StatsProgress')
    , statsResult = mongoose.model('StatsResult')
    , statsClick = mongoose.model('StatsClick')
    , statsCentral = mongoose.model('StatsCentral');

module.exports = {

    integrate: function (callback) {
        statsSession.getExpired(function (err, expiredSessions) {
            if (err) return callback(err);
            console.info('CRON [%s] Statistics: Integrating %d expired session(s).', new Date().toUTCString(), expiredSessions.length);
            var topUp = function (obj, key) { if (key) { obj[key] = obj[key] ? obj[key] + 1 : 1; } }
                , referers = {}
                , userAgents = {}
                , progresses = {}
                , results = {}
                , clicks = {};
            expiredSessions.forEach(function (expiredSession) {
                topUp(referers, encodeURIComponent(expiredSession.referer || '(no referer)'));
                topUp(userAgents, encodeURIComponent(expiredSession.userAgent || '(no user agent)'));
                topUp(progresses, expiredSession.progress);
                topUp(results, expiredSession.persona);
                for (var c = expiredSession.clicked.length; --c >= 0; ) {
                    topUp(clicks, expiredSession.clicked[c]);
                }
                expiredSession.remove();
            });
            async.parallel([
                function (callback) {
                    async.forEach(Object.keys(referers), function (key, callback) {
                        statsReferer.adjustTotal({referer: decodeURIComponent(key), increment: referers[key]}, callback);
                    });
                },
                function (callback) {
                    async.forEach(Object.keys(userAgents), function (key, callback) {
                        statsUserAgent.adjustTotal({userAgent: decodeURIComponent(key), increment: userAgents[key]}, callback);
                    });
                },
                function (callback) {
                    async.forEach(Object.keys(progresses), function (key, callback) {
                        statsProgress.adjustTotal({progress: key, increment: progresses[key]}, callback);
                    });
                },
                function (callback) {
                    async.forEach(Object.keys(results), function (key, callback) {
                        statsResult.adjustTotal({persona: key, increment: results[key]}, callback);
                    });
                },
                function (callback) {
                    async.forEach(Object.keys(clicks), function (key, callback) {
                        statsClick.adjustTotal({target: key, increment: clicks[key]}, callback);
                    });
                }
            ]);
        });
    },

    centralExchange: function (callback) {
        var whatToSync = {};
        async.parallel([
            function (callback) {
                statsResult.retrieve(function (err, result) {
                    if (result.length > 0) {
                        whatToSync.result = result;
                    }
                    callback();
                });
            }
        ], function(err) {
            if (err) return typeof callback === 'function' ? callback(err) : undefined;
            var config = Configuration.render(),
                req,
                reqOptions,
                reqBody = { id: config.id, country: config.country },
                sync = Object.keys(whatToSync);
            console.info('CRON [%s] Statistics: Sending %d item(s) to centralized database.', new Date().toUTCString(), sync.length);
            for (var itemName in sync) {
                reqBody[itemName] = JSON.stringify(sync[itemName]);
            }
            reqBody = querystring.stringify(reqBody);
            reqOptions = {
                host: config.centralDatabaseHost,
                port: config.centralDatabasePort,
                path: config.centralDatabasePath,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': reqBody.length
                }
            };
            req = (config.centralDatabaseUrl.indexOf('https://') === 0 ? https : http).request(reqOptions, function(res) {
                var data = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    if (data.length > 75000) {
                        // sanity check to preserve memory/database health
                        data = 'corrupt://';
                    } else {
                        data += chunk;
                    }
                });
                res.on('end', function () {
                    try {
                        data = JSON.parse(data);
                    } catch (err) {
                        return;
                    }
                    console.info('CRON [%s] Statistics: Receiving %d item(s) from centralized database.', new Date().toUTCString(), data.result ? 1 : 0);
                    if (!data.result) {
                        console.error('Empty response from centralized database.');
                        return;
                    }
                    async.forEach(Object.keys(data), function (key, callback) {
                        statsCentral.insertOrUpdate({key: key, value: data[key]}, callback);
                    }, function(err) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        Configuration.set('centralDatabaseLastSync', new Date());
                    });
                });
            });
            req.on('error', function (err) {
                console.error(err);
            });
            req.end(reqBody);
            return typeof callback === 'function' ? callback(err) : undefined;
        });
    }

};