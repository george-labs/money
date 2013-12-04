var Branding = require('../models/Branding')
    , BrandingLive = require('../models/BrandingLive')
    , Configuration = require('../utils/Configuration')
    , Element = require('../models/Element')
    , Page = require('../models/Page')
    , PageElement = require('../models/PageElement')
    , PageElementProperty = require('../models/PageElementProperty')
    , PageLive = require('../models/PageLive')
    , PageElementLive = require('../models/PageElementLive')
    , PageElementPropertyLive = require('../models/PageElementPropertyLive')
    , Property = require('../models/Property')
    , Setting = require('../models/Setting')
    , SettingLive = require('../models/SettingLive')
    , User = require('../models/User')
    , async = require('async')
    , AppVersion = require('../models/AppVersion')
    , BrandingDao = require('../daos/BrandingDao')
    , AppVersionDao = require('../daos/AppVersionDao')
    , systemReadyFilter = require('../filter/SystemReadyFilter');

var brandingDao = new BrandingDao();
var appVersionDao = new AppVersionDao();

var CMSController = {
    indexAction: function(req, res) {
        appVersionDao.findAllVersions(function(err, appVersions) {
            systemReadyFilter.isReady(function (isReady) {
                appVersionDao.isDatabaseResetRequested(function(dbReset) {
                    res.render('cms', {
                        config: Configuration.render(req),
                        isAdmin: req.isAuthenticated(),
                        isReady: isReady,
                        appVersions: appVersions,
                        dbReset: dbReset
                    });
                });
            });
        }, false);
    },

    resetTables: function(models, cb) {
        function iterator(Model_, cb) {
            var i = new Model_();
            i.collection.drop(function (err) { cb(); });
        };
        async.forEachSeries(models, iterator, function(err) {
            brandingDao.recreateCss([], cb);
        });
    },
            
    resetDatabaseAction: function(databaseName, initCallback) {

        return function(req, res) {
            var resBody = { status: 'ERR' };
            appVersionDao.isDatabaseResetRequested(function(dbReset) {
                appVersionDao.cancelDatabaseReset(function() {
                    if (dbReset) {
                        var models = [
                            Branding, BrandingLive, Element, Page, PageElement, PageElementProperty,
                            PageLive, PageElementLive, PageElementPropertyLive,
                            Property, Setting, SettingLive, AppVersion
                        ];

                        CMSController.resetTables(models, function() {
                            initCallback();
                            resBody.status = 'OK';
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.write(JSON.stringify(resBody));
                            res.end();
                        });
                    }
                });
            });
        };
    },

    requestDatabaseResetAction: function(req, res) {
        var resBody = { status: 'ERR' };
        appVersionDao.requestDatabaseReset(function(err) {
            resBody.status = 'OK';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resBody));
            res.end();
        });
    },

    cancelDatabaseRequestAction: function(req, res) {
        var resBody = { status: 'ERR' };
        appVersionDao.cancelDatabaseReset(function(err) {
            resBody.status = 'OK';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resBody));
            res.end();
        });
    },

    restoreAppVersion: function(appVersion, cb) {
        var iterator = function(item, callback) {
            if (typeof item.dao === 'undefined') {
                async.forEach(item.items, function(listItem, callback2) {
                    var model = new item.model;

                    for (var i in listItem) {
                        model[i] = listItem[i];
                    }

                    model.save(callback2);
                }, callback);
            } else {
                var models = [];

                item.items.forEach(function(listItem) {
                    var model = new item.model;

                    for (var i in listItem) {
                        model[i] = listItem[i];
                    }

                    models.push(model);
                });

                item.dao.saveAll(models, callback);
            }
        };
        
        async.forEach([
            {
                model: Page,
                items: appVersion.pages
            },
            {
                model: PageElement,
                items: appVersion.pageElements
            },
            {
                model: PageElementProperty,
                items: appVersion.pageElementProperties
            },
            {
                model: Setting,
                items: appVersion.settings
            },
            {
                model: Branding,
                items: appVersion.brandings,
                dao: brandingDao
            }
        ], iterator, cb);
    },
            
    restoreAppVersionAction: function(req, res) {
        var id = req.body.id;
        var pages = true;
        var settings = false;
        var brandings = false;

        if (typeof req.body.pages !== 'undefined') {
            pages = req.body.pages === 'true';
        }

        if (typeof req.body.settings !== 'undefined') {
            settings = req.body.settings === 'true';
        }

        if (typeof req.body.brandings !== 'undefined') {
            brandings = req.body.brandings === 'true';
        }

        var resBody = { status: 'ERR' };

        if (typeof id !== 'undefined') {
            appVersionDao.restoreVersion(id, false, function() {
                resBody.status = 'OK';
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(resBody));
                res.end();
            }, pages, settings, brandings);
        }
    },

    createAppVersionAction: function(req, res) {
        var resBody = { status: 'ERR' };
        var tag = req.body.tag;

        appVersionDao.createAppVersion(tag, false, function (err, appVersion) {
            resBody.status = 'OK';
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resBody));
            res.end();
        });
    },

    removeAppVersionAction: function(req, res) {
        var id = req.body.id;
        var resBody = { status: 'ERR' };

        if (typeof id !== 'undefined') {
            appVersionDao.removeVersion(id, function (err) {
                resBody.status = 'OK';
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(resBody));
                res.end();
            });
        }
    },

    goOnlineAction: function(req, res) {
        var resBody = { status: 'ERR' };
        systemReadyFilter.isReady(function (ready, messages) {
            appVersionDao.createAppVersion('', true, function (err, appVersion) {
                appVersionDao.restoreVersion(appVersion._id, true, function() {
                    resBody.status = ready ? 'OK' : 'ERR';
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(resBody));
                    res.end();
                }, true, true, true);
            });
        }, 'edit');
    },

    goOfflineAction: function(req, res) {
        var resBody = { status: 'ERR' };
        appVersionDao.resetTables([
            PageLive, PageElementLive, PageElementPropertyLive,
            SettingLive, BrandingLive
            ], function(err) {
                resBody.status = 'OK';
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(resBody));
                res.end();
            }
        );
    }

};

module.exports = CMSController;