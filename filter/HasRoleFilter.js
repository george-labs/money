module.exports = function(role) {
    return function(req, res, next) {
        if (req.user.role === role) {
            next();
        } else {
            res.writeHead(403, {'Content-Type': 'application/json'});
            res.end();
        }
    };
};