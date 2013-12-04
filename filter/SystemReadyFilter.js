var PageLive = require('../models/PageLive');

var isReady = function(callback, mode) {

    if (typeof mode === 'undefined') {
        mode = 'live';
    }

    PageLive.find().exec(function(err, pages) {
        var ready = true;
        if ((pages === null || pages.length === 0) && mode === 'live') {
            ready = false;
        }
        callback(ready);
    });
};

var systemready = function(req, res, next) {

    isReady(function(isReady) {
        if (isReady) {
            next();
        } else {
            res.send(404);
        }
    });
};

systemready.isReady = isReady;


module.exports = systemready;