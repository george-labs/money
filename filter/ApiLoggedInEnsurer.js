module.exports = function() {
    return function(req, res, next) {
        if (req.isAuthenticated && req.isAuthenticated()) {
            next();
        } else {
            if (req.session) {
                var referer = req.headers['referer'];
                if (referer) {
                    req.session.returnTo = referer;
                }
            }
            res.writeHead(403, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({status: 'ERR', message: 'Not authorized'}));
            res.end();
        }
    };
};