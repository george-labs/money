var Setting = require('../models/Setting')
  , SettingLive = require('../models/SettingLive')
  , SettingVersion = require('../models/SettingVersion')
  , async = require('async');

/**
 * Creates a new instance of SettingDao.
 *
 * @constructor
 * @this {SettingDao}
 * @param {boolean} live Whether or not live version should be used.
 */
function SettingDao(live) {
    if (live) {
        this.models = {
            SettingDao: SettingDaoLive
        }
    } else {
        this.models = {
            SettingDao: SettingDao
        }
    }
};

/**
 * Fetches all settings from database and invokes the callback in success and error case.
 *
 * @this {SettingDao}
 * @param {function} callback Callback function
 */
SettingDao.prototype.findAll = function(callback) {
    Setting.find().sort({sortOrder: 'ASC'}).exec(callback);
};

/**
 * Saves a given setting.
 *
 * @this {SettingDao}
 * @param {Setting} setting Setting
 * @param {function} callback Callback function
 * @param {boolean} createVersion Whether or not a new version should be created before save process
 */
SettingDao.prototype.save = function (setting, finalCallback, createVersion) {
    var that = this;

    if (typeof createVersion === 'undefined') {
        createVersion = true;
    }

    if (typeof finalCallback === 'undefined') {
        finalCallback = function (err, setting){};
    }

    async.series([
        function (callback) {
            if (createVersion) {
                Setting.findById(setting._id).exec(function (err, setting) {
                    settingVersion = new SettingVersion();
                    settingVersion.refId = setting;
                    settingVersion.value = setting.value;
                    settingVersion.save(callback);
                });
            } else {
                callback(null, null);
            }
        },
        function (callback) {
            setting.save(callback);
        }
    ], function (err) {
        finalCallback(err, setting);
    });
};

/**
 * Restores a SettingVersion by prodiving its id.
 *
 * @this {SettingDao}
 * @param {string} id Id of SettingVersion
 * @param {function} callback Callback function
 */
SettingDao.prototype.restoreVersion = function (id, callback) {
    var that = this;
    SettingVersion.findById(id).populate('refId').exec(function (err, settingVersion) {
        var setting = settingVersion.refId;
        setting.value = settingVersion.value;
        that.save(setting, callback);
    });
};

module.exports = SettingDao;
