var User = require('../models/User');

module.exports = function(req, res, next) {
    if (typeof req.session.passport.user !== 'undefined') {
        User.findById(req.session.passport.user).exec(function(err, user) {
            req.user = user;
            res.locals.user = user;
            res.locals.url = req.protocol + "://" + req.get('host') + req.url;
            next();
        });
    } else {
        next();
    }
};