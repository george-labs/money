var Setting = require('../models/Setting'),
    Configuration = require('../utils/Configuration'),
    User = require('../models/User');

/*
 * GET login page.
 */


var LoginController = {

    indexAction: function(req, res) {
        res.render('login', {
            config: Configuration.render(req),
            message: req.flash('error'),
            isAdmin: true
        });
    },

    timeoutAction: function(req, res) {
        req.flash('error', 'Sorry, your session expired.');
        res.render('login', {
            config: Configuration.render(req),
            message: req.flash('error'),
            isAdmin: true
        });
    },

    changePasswordAction: function(req, res) {
        res.render('change-password', {
            config: Configuration.render(req),
            isAdmin: req.isAuthenticated()
        });
    },

    updatePasswordAction: function(req, res) {
        var username = req.user.username,
            oldPassword = req.body.oldpassword,
            newPassword = req.body.newpassword1,
            newPasswordConfirm = req.body.newpassword2,
            callback = function (err, user) {
                if (err) {
                    req.flash('error', err.message);
                    res.render('change-password', {
                        config: Configuration.render(req),
                        message: req.flash('error'),
                        isAdmin: req.isAuthenticated()
                    });
                } else {
                    req.user = user;
                    res.redirect('/cms?user-OK');
                }
            };
        if (typeof newPassword === 'string' && newPassword.length && newPassword !== newPasswordConfirm) {
            return callback({message: 'New passwords do not match.'}, null);
        } else if (typeof oldPassword === 'string' && oldPassword === newPassword) {
            return callback({message: 'New password does not differ from old password.'}, null);
        }
        User.findOne({username: username}).exec(function(err, user) {
            if (err) {
                return callback({message: 'Unexpected problem. Try logging off and on again.'}, user);
            } else if (!user) {
                return callback({message: 'Invalid credentials. Try logging off and on again.'}, user);
            }
            if (!user.validatePassword(oldPassword)) {
                return callback({message: 'Old password is incorrect.'}, user);
            }
            user.setPassword(newPassword);
            user.save(callback);
        });
    }

};

module.exports = LoginController;