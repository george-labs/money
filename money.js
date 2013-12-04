/**
 * Starting point for Money app
 * http-server
 */

// Module dependencies (environment)
var flash = require('connect-flash') //has to be on top of all requires
    , express = require('express')
    , fs = require('fs')
    , http = require('http')
    , path = require('path')
    , lessMiddleware = require('less-middleware')
    , nconf = require('nconf')
    , cronJob = require('cron').CronJob
    , check = require('validator').check
    , async = require('async');

// Module dependencies (database)
var mongoose = require('mongoose')
    , MongoStore = require('connect-mongo')(express)
    , Schema = mongoose.Schema;

// Module dependencies (authentication)
var passport = require('./utils/PassportUtil')
    , login = require('connect-ensure-login');

// Init
var SettingInit = require('./init/SettingInit')
    , BrandingInit = require('./init/BrandingInit')
    , UserInit = require('./init/UserInit')
    , ElementInit = require('./init/ElementInit')
    , PageInit = require('./init/PageInit');

// Models
var User = require('./models/User');
require('./models/statistics/Session');
require('./models/statistics/Referer');
require('./models/statistics/UserAgent');
require('./models/statistics/Progress');
require('./models/statistics/Result');
require('./models/statistics/Click');
require('./models/statistics/Central');

// Filter
var systemReadyFilter = require('./filter/SystemReadyFilter')
    , apiLoggedInEnsurer = require('./filter/ApiLoggedInEnsurer')
    , userLoadFilter = require('./filter/UserLoadFilter')
    , hasRoleFilter = require('./filter/HasRoleFilter');

// Read configuration (environment)
var Configuration = require('./utils/Configuration');
nconf.argv().env().file({ file: 'settings.json' }).defaults({
    'env': 'production',
    'port': 8080,
    'database': {
        'host': '127.0.0.1',
        'port': 27017
    }
});

(function () {
    var value, errors = [];
    value = nconf.get('id');
    if (!value) {
        errors.push('Missing value id');
    }
    value = nconf.get('instance');
    if (!/[0-9a-zA-Z]/.test(value)) {
        errors.push('Illegal value instance: ' + value);
    }
    value = nconf.get('port');
    if (!/[0-9]+/.test(value)) {
        errors.push('Illegal value port: ' + value);
    }
    value = nconf.get('country');
    if (!/^[A-Z]{2}$/.test(value)) {
        errors.push('Missing/illegal value country: ' + value);
    }
    value = nconf.get('centralDatabase');
    if (typeof value !== 'object' || !value.host) {
        errors.push('Missing/illegal value centralDatabase: ' + (typeof value === 'object' ? JSON.stringify(value) : value));
    }
    value = nconf.get('users');
    if (value && typeof value !== 'object' && !(value instanceof Array)) {
        errors.push('Illegal value users: ' + (typeof value === 'object' ? JSON.stringify(value) : value));
    }
    if (errors.length > 0) {
        for (var i in errors) {
            console.error(errors[i]);
        }
        console.info('Check your configuration and your settings.json file!');
        process.exit(1);
    }
}());

// Set regular + session configuration (database)
var mongoconf = {
    db: {
        db: 'moneyfhc' + nconf.get('instance') + 'session',
        host: nconf.get('database:host'),
        port: nconf.get('database:port'),
        auto_reconnect: true
        //username: 'admin', // optional
        //password: 'secret', // optional
    },
    secret: '98B43ACFB8A9720B19A1CB485C7117BA'
};

// Initialization
var app = express();

// All environments
app.configure(function() {
    var dev = 'development' === nconf.get('env').toLowerCase();
    app.locals.basedir = path.join(__dirname, '/views');
    app.use(express.favicon(__dirname + '/public/favicon.ico'));
    app.use(express.logger(dev ? 'dev' : 'short'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    if (dev) {
        Configuration.set('verbose', nconf.get('env'));
        app.use(lessMiddleware({ src: path.join(__dirname, '/public') }));
        app.use(express.static(path.join(__dirname, '/public')));
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    } else {
        app.use(express.compress());
        //app.use(lessMiddleware({ src: path.join(__dirname, '/public'), compress: true }));
        app.use(express.static(path.join(__dirname, '/public'), { maxAge: 86400 }));
        app.use(express.errorHandler());
    }
    app.use(express.cookieParser()); // must be before express.session
    app.use(express.bodyParser());
    app.use(express.session({ cookie: { maxAge: null }, secret: mongoconf.secret, store: new MongoStore(mongoconf.db) }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session({ secret: mongoconf.secret }));
    app.use(passport.authenticate('remember-me'));
    app.use(userLoadFilter);
    app.use(app.router);
    app.set('port', nconf.get('port'));
    app.set('views', path.join(__dirname, '/views'));
    app.set('view engine', 'jade');
});

// Connect to database
var dbInit = function() {
    async.series([
        function(callback) { SettingInit.init(callback); },
        function(callback) { BrandingInit.init(callback); },
        function(callback) { UserInit.init(nconf.get('users'), callback); },
        function(callback) { ElementInit.init(callback); },
        function(callback) { PageInit.init(callback); }
    ]);
}

mongoose.connect('mongodb://' + mongoconf.db.host + ':' + mongoconf.db.port + '/moneyfhc' + nconf.get('instance'));
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    dbInit();
});

// cron jobs
(function() {
    var appId = nconf.get('id'),
        appHashCode = (function(s){ return s.split('').reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);}(appId)),
        cdbUrl,
        cdbHost,
        cdbPort,
        cdbPath,
        hours = appHashCode < 0 ? [2, 4] : [3, 5],
        minute = Math.abs(appHashCode % 60),
        utcOffset = (function () {
            var offset = new Date().getTimezoneOffset(),
                offsetHours = Math.floor(Math.abs(offset) / 60),
                offsetMinutes = Math.floor(Math.abs(offset) - (offsetHours * 60));
            return 'UTC' + (offset > 0 ? '-' : '+') + offsetHours + (offsetMinutes === 0 ? '' : ':' + ('0' + offsetMinutes).slice(-2));
        }());
    Configuration.set('id', appId);
    Configuration.set('country', nconf.get('country'));
    cdbHost = nconf.get('centralDatabase').host;
    cdbPort = nconf.get('centralDatabase').port || 443;
    cdbPath = nconf.get('centralDatabase').path || '/';
    if (cdbPort === 443) {
        cdbUrl = 'https://' + cdbHost + cdbPath;
    } else if (cdbPort === 80) {
        cdbUrl = 'http://' + cdbHost + cdbPath;
    } else {
        cdbUrl = 'http://' + cdbHost + ':' + cdbPort + cdbPath;
    }
    Configuration.set('centralDatabaseUrl', cdbUrl);
    Configuration.set('centralDatabaseHost', cdbHost);
    Configuration.set('centralDatabasePort', cdbPort);
    Configuration.set('centralDatabasePath', cdbPath + (cdbPath.slice(-1) === '/' ? '' : '/') + 'sync');
    console.info('Housekeeping cron job running nightly at %s:%s %s', '1', '45', utcOffset);
    new cronJob('0 45 1 * * *', function() {
        require('./utils/StatisticsUpdater.js').integrate();
    }, null, true);
    for (var i in hours) {
        console.info('Central sync cron job running nightly at %s:%s %s', hours[i], ('0' + minute).slice(-2), utcOffset);
    }
    new cronJob('0 ' + minute + ' ' + hours.join(',') + ' * * *', function() {
        require('./utils/StatisticsUpdater.js').centralExchange();
    }, null, true);
}());

// Routes
var IndexController = require('./routes/index')
    , CMSController = require('./routes/cms')
    , LoginController = require('./routes/login')
    , SettingsController = require('./routes/settings')
    , BrandingsController = require('./routes/brandings')
    , StatisticsController = require('./routes/statistics');

// CMS URLs
app.get('/login', login.ensureLoggedOut('/cms'), LoginController.indexAction);
app.get('/login/timeout', login.ensureLoggedIn('/login'), LoginController.timeoutAction);
app.get('/cms', login.ensureLoggedIn('/login'), CMSController.indexAction);
app.get('/cms/change-password', login.ensureLoggedIn('/login'), LoginController.changePasswordAction);
app.post('/cms/change-password', login.ensureLoggedIn('/login'), LoginController.updatePasswordAction);
app.get('/metadata', login.ensureLoggedIn('/login'), SettingsController.indexAction);
app.post('/metadata/save', [apiLoggedInEnsurer(), hasRoleFilter('editor')], SettingsController.saveSettingAction);
app.get('/branding', login.ensureLoggedIn('/login'), BrandingsController.indexAction);
app.post('/branding/save', [apiLoggedInEnsurer(), hasRoleFilter('editor')], BrandingsController.saveBrandingAction);
app.get('/statistics', login.ensureLoggedIn('/login'), StatisticsController.indexAction);
app.post('/statistics/integrate', [apiLoggedInEnsurer(), hasRoleFilter('chiefeditor')], StatisticsController.housekeepingAction);
app.post('/statistics/synchronize', [apiLoggedInEnsurer(), hasRoleFilter('chiefeditor')], StatisticsController.centralExchangeAction);
app.post('/admin/page-element-form', apiLoggedInEnsurer(), IndexController.pageElementFormAction);
app.post('/admin/save-property-value', [apiLoggedInEnsurer(), hasRoleFilter('editor')], IndexController.pageElementSaveAction);
app.post('/admin/create-pageelement-version', [apiLoggedInEnsurer(), hasRoleFilter('editor')], IndexController.createPageElementVersionAction);
app.post('/admin/restore-pageelement-version', [apiLoggedInEnsurer(), hasRoleFilter('editor')], IndexController.restorePageElementVersion);
app.post('/admin/remove-pageelement-version', [apiLoggedInEnsurer(), hasRoleFilter('editor')], IndexController.removePageElementVersionAction);
app.post('/admin/create-app-version', [apiLoggedInEnsurer(), hasRoleFilter('editor')], CMSController.createAppVersionAction);
app.post('/admin/restore-app-version', [apiLoggedInEnsurer(), hasRoleFilter('editor')], CMSController.restoreAppVersionAction);
app.post('/admin/remove-app-version', [apiLoggedInEnsurer(), hasRoleFilter('editor')], CMSController.removeAppVersionAction);
app.post('/admin/go-online', [apiLoggedInEnsurer(), hasRoleFilter('chiefeditor')], CMSController.goOnlineAction);
app.post('/admin/go-offline', [apiLoggedInEnsurer(), hasRoleFilter('chiefeditor')], CMSController.goOfflineAction);
app.post('/admin/request-database-reset', [apiLoggedInEnsurer(), hasRoleFilter('editor')], CMSController.requestDatabaseResetAction);
app.post('/admin/cancel-database-reset', [apiLoggedInEnsurer(), hasRoleFilter('editor')], CMSController.cancelDatabaseRequestAction);
app.post('/admin/reset-database', [apiLoggedInEnsurer(), hasRoleFilter('chiefeditor')], CMSController.resetDatabaseAction('moneyfhc' + nconf.get('instance'), dbInit));

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), function(req, res, next) {
    passport.issueToken(req.user, function(err, token) {
        var twoDays = 2 * 24 * 60 * 60 * 1000;
        res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: twoDays });
        next();
    });
}, function(req, res) {
    // redirect to cms or last visited page
    var url = '/cms';
    if (req.session && req.session.returnTo) {
        url = req.session.returnTo;
        delete req.session.returnTo;
    }
    return res.redirect(url);

});

app.get('/logout', function(req, res){
    passport.consumeRememberMeToken(res.cookie('remember_me'), function(err) {
        res.clearCookie('remember_me');
    });
    req.logout();
    res.redirect('/login');
});

app.get('/', systemReadyFilter, IndexController.indexAction(false));

app.get('/forward', systemReadyFilter, IndexController.forwardAction);
app.get('/share/:service', systemReadyFilter, IndexController.shareAction);

app.get('/translations', login.ensureLoggedIn('/login'), IndexController.indexAction(true));
app.get('/translations/:page', login.ensureLoggedIn('/login'), IndexController.indexAction(true));

app.post('/:page', systemReadyFilter, IndexController.indexAction(false));
app.get('/:page', systemReadyFilter, IndexController.indexAction(false));

//404 handling has to be last route
app.use(IndexController.pageNotFoundAction);

// Http server
http.createServer(app).listen(nconf.get('port'), function(){
    console.info('Express %s server listening on port %d', nconf.get('env'), nconf.get('port'));
});