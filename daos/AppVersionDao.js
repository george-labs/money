var Branding = require('../models/Branding')
  , BrandingLive = require('../models/BrandingLive')
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
  , SettingDao = require('../daos/SettingDao')
  , PageElementVersion = require('../models/PageElementVersion')
  , ResetStatus = require('../models/ResetStatus')
  , PageElementDao = require('../daos/PageElementDao');


/**
 * Creates a new instance of AppVersionDao.
 *
 * @constructor
 * @this {AppVersionDao}
 */
function AppVersionDao () {

}

/**
 * Searches an AppVersion by id.
 *
 * @this {AppVersionDao}
 * @param {string} id Id of AppVersion
 * @param {function} callback Callback
 */
AppVersionDao.prototype.findById = function (id, callback) {
    AppVersion.findById(id).exec(callback);
};

/**
 * Removes the complete data of the given tables.
 *
 * @this {AppVersionDao}
 * @param {array} tables List of tables to reset
 * @param {function} callback Callback invoked when all tables are empty
 */
AppVersionDao.prototype.resetTables = function (tables, callback) {
    if (typeof tables === 'undefined') {
        var tables = [
            Branding, Element, Page, PageElement, PageElementProperty,
            Property, Setting, User
        ];
    }

    if (typeof callback === 'undefined') {
        callback = function (err) {};
    }

    function iterator(Model_, cb) {
        var i = new Model_();
        i.collection.drop(cb);
    };

    async.forEachSeries(tables, iterator, callback);
}

/**
 * Finds all or all live versions.
 *
 * @this {AppVersionDao}
 * @param {function} callback Callback
 * @param {boolean} liveOnly Whether or not live versions should only be searched
 */
AppVersionDao.prototype.findAllVersions = function (callback, liveOnly) {
    var conditions = {};

    if (typeof liveOnly === 'undefined') {
        liveOnly = false;
    }

    if (liveOnly) {
        conditions.liveVersion = true;
    }

    AppVersion.find(conditions).sort({ creationDate: 'descending' }).exec(callback);
};

/**
 * Restores a given AppVersion.
 *
 * @this {AppVersionDao}
 * @param {AppVersion} appVersion AppVersion to restore
 * @param {boolean} live Whether or not it should be restored in live mode (only possible for live versions)
 * @param {callback} callback Callback invoked after AppVersion is restored
 * @param {boolean} restorePages Whether or not Pages, PageElements and PageElementProperties should be restored
 * @param {boolean} restoreSettings Whether or not Settings should be restored
 * @param {boolean} restoreBrandings Whether or not Brandings should be restored
 */
AppVersionDao.prototype.restoreVersion = function (appVersion, live, callback, restorePages, restoreSettings, restoreBrandings) {
    var that = this;

    if (typeof restorePages === 'undefined') {
        restorePages = true;
    }

    if (typeof restoreSettings === 'undefined') {
        restoreSettings = false;
    }

    if (typeof restoreBrandings === 'undefined') {
        restoreBrandings = false;
    }

    if (!restorePages && !restoreSettings && !restoreBrandings) {
        return;
    }

    if (typeof callback === 'undefined') {
        callback = function (err, appVersion) {};
    }

    if (typeof live === 'undefined') {
        live = false;
    }

    var models = {
        live: {
            Page: PageLive,
            PageElement: PageElementLive,
            PageElementProperty: PageElementPropertyLive,
            Setting: SettingLive,
            Branding: BrandingLive
        },
        edit: {
            Page: Page,
            PageElement: PageElement,
            PageElementProperty: PageElementProperty,
            Setting: Setting,
            Branding: Branding
        }
    };

    var id = appVersion;

    if (typeof appVersion._id !== 'undefined') {
        id = appVersion._id;
    }

    AppVersion.findById(id).exec(function(err, appVersion) {
        var mode = (appVersion.liveVersion && live) ? 'live' : 'edit';

        var tables = [];

        if (restorePages) {
            tables.push(models[mode].Page);
            tables.push(models[mode].PageElement);
            tables.push(models[mode].PageElementProperty);
        }

        if (restoreSettings) {
            tables.push(models[mode].Setting);
        }

        if (restoreBrandings) {
            tables.push(models[mode].Branding)
        }

        that.resetTables(tables, function(err) {
            var items = [];

            if (restorePages) {
                items.push({
                    model: models[mode].Page,
                    items: appVersion.pages
                });
                items.push({
                    model: models[mode].PageElement,
                    items: appVersion.pageElements,
                    dao: new PageElementDao(live)
                });
                items.push({
                    model: models[mode].PageElementProperty,
                    items: appVersion.pageElementProperties
                });
            }

            if (restoreSettings) {
                items.push({
                    model: models[mode].Setting,
                    items: appVersion.settings
                    //dao: new SettingDao((appVersion.liveVersion && live));
                });
            }

            if (restoreBrandings) {
                items.push({
                    model: models[mode].Branding,
                    items: appVersion.brandings,
                    dao: new BrandingDao(live)
                });
            }

            that.restore(items, callback);
        });
    });
};

/**
 * Restores elements using the given models.
 * A model has to provide a model property containing the class or a dao property providing a dao
 * that provides a saveAll method and an items property containing the items that should be restored.
 *
 * @this {AppVersionDao}
 * @param {array} models List of models
 * @param {function} cb Callback invoked after restore process
 */
AppVersionDao.prototype.restore = function (models, cb) {
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

    async.forEach(models, iterator, cb);
};

AppVersionDao.prototype.createAppVersion = function (tag, live, callback) {

    if (typeof tag === 'undefined') {
        tag = '';
    }

    Page.find().exec(function(err, pages) {
        PageElement.find().exec(function (err, pageElements) {
            PageElementProperty.find().exec(function (err, pageElementProperties) {
                Setting.find().exec(function (err, settings) {
                   Branding.find().exec(function (err, brandings) {
                       var appVersion = new AppVersion({
                           pages: pages,
                           pageElements: pageElements,
                           pageElementProperties: pageElementProperties,
                           settings: settings,
                           brandings: brandings,
                           tag: tag,
                           liveVersion: live
                       });

                       appVersion.save(callback);
                   });
                });
            });
        });
    });
};

AppVersionDao.prototype.requestDatabaseReset = function(callback) {
    ResetStatus.find().exec(function (err, resetStatus) {
        var status;

        if (resetStatus.length > 0) {
            status = resetStatus[0];
        } else {
            status = new ResetStatus();
        }

        status.status = true;
        status.save(callback);
    });
};

AppVersionDao.prototype.cancelDatabaseReset = function(callback) {
    ResetStatus.find().exec(function (err, resetStatus) {
        var status;

        if (resetStatus.length > 0) {
            status = resetStatus[0];
        } else {
            status = new ResetStatus();
        }

        status.status = false;
        status.save(callback);
    });
};

AppVersionDao.prototype.isDatabaseResetRequested = function(callback) {
    ResetStatus.find().exec(function (err, resetStatus) {
        var status;

        if (resetStatus.length > 0) {
            status = resetStatus[0];
        } else {
            status = new ResetStatus();
            status.status = false;
        }

        callback(status.status);
    });
};

AppVersionDao.prototype.removeVersion = function (id, callback) {
    AppVersion.findByIdAndRemove(id, callback);
};


module.exports = AppVersionDao;

