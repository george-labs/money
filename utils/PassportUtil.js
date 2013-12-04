var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , User = require('../models/User')
    , Token = require('../models/Token')
    , RememberMeStrategy = require('passport-remember-me').Strategy;

function consumeRememberMeToken(token, fn) {
    Token.findById(token).exec(function(err, token) {
        if (!token) { return fn(err, null); }
        token.remove(function(err) {
            fn(null, token.uid);
        });
    });
}

function saveRememberMeToken(token, uid, fn) {
    token.uid = uid;
    token.save(fn);
}

function issueToken(user, done) {
    var token = new Token();
    saveRememberMeToken(token, user.id, function(err, token) {
        done(null, token._id);
    });
}

passport.consumeRememberMeToken = consumeRememberMeToken;


// Authentication
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Invalid credentials.' });
            }
            if (!user.validatePassword(password)) {
                return done(null, false, { message: 'Invalid credentials.' });
            }

            return done(null, user);
        });
    }
));

passport.use(new RememberMeStrategy(
    function(token, done) {
        consumeRememberMeToken(token, function(err, uid) {
            if (err) { return done(err); }
            if (!uid) { return done(null, false); }

            User.findById(uid, function (err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false); }
                return done(null, user);
            });
        });
    },
    issueToken
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.issueToken = issueToken;

module.exports = passport;