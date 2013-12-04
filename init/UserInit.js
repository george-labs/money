var User = require('../models/User')
  , async = require('async');

exports.init = function(preset, finishCallback) {
    var calls = [],
        insert = function (user) {
            if (typeof user === 'object'
                    && typeof user.name === 'string'
                    && typeof user.role === 'string'
                    && typeof user.password === 'string'
                    && /^[0-9a-zA-Z@_\.\-]+$/.test(user.name)
                    && ['chiefeditor', 'editor'].indexOf(user.role) !== -1
                    && user.password.length > 0) {
                calls.push(function(callback) {
                    User.findOne({username: user.name}).exec(function(err, existingUser) {
                        if (existingUser === null) {
                            // do not modify existing users
                            var newUser = new User({
                                username: user.name,
                                role: user.role
                            });
                            newUser.setPassword(user.password);
                            newUser.save(callback);
                        } else {
                            callback(err, null);
                        }
                    });
                });
            }
        };
    for (var user in preset) {
        insert(preset[user]);
    }
    async.parallel(calls, finishCallback);
};