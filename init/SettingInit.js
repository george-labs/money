var Array = require('../utils/ArrayExtension.js')
    , Setting = require('../models/Setting.js')
    , async = require('async');

/**
 * Constructor of SystemSettings.
 */
var SystemSettings = function() {
    this._settings = {};
    this._settingsDefault = {};
    this.initValues();
};

/**
 * Names of default settings.
 * @type {object}
 */
SystemSettings.default = {
    META_TAGS_NAME: 'keywords',             //has to be html5 meta tag name
    META_AUTHOR_NAME: 'authors',            //has to be html5 meta tag name
    META_LANGUAGE_NAME: 'language',         //has to be html5 meta tag name
    META_DESCRIPTION_NAME: 'description'    //has to be html5 meta tag name
};

/**
 * Method to add existing settings.
 * @this {SystemSettings}
 * @param {string} name Name of setting
 * @param {Setting} setting Setting object
 */
SystemSettings.prototype.add = function(name, setting) {
    setting.name = name;
    this._settings[name] = setting; //array of settings stored in DB
};

/**
 * Method to add default settings.
 * @this {Systemsettings}
 * @param {string} name Name of setting
 * @param {Setting} setting Setting object
 */
SystemSettings.prototype.addDefault = function(name, setting) {
    setting.name = name;
    this._settingsDefault[name] = setting;  //array of settings we have by default
};

/**
 * Initializes all default settings.
 * @this {SystemSettings}
 */
SystemSettings.prototype.initValues = function() {
    //Default values for all settings

    this.addDefault(SystemSettings.default.META_LANGUAGE_NAME, new Setting({
        label: 'Language',
        inputType: 'text',
        value: 'EN',
        description: '',
        sortOrder: 10
    }));
    this.addDefault(SystemSettings.default.META_AUTHOR_NAME, new Setting({
        label: 'Author',
        inputType: 'text',
        value: '',
        description: '',
        sortOrder: 20
    }));
    this.addDefault(SystemSettings.default.META_DESCRIPTION_NAME, new Setting({
        label: 'Description',
        inputType: 'textarea',
        value: '',
        description: '',
        sortOrder: 30
    }));
    this.addDefault(SystemSettings.default.META_TAGS_NAME , new Setting({
        label: 'Keywords',
        inputType: 'textarea',
        value: '',
        description: 'SEO keywords separated by comma.',
        sortOrder: 40
    }));
};

/**
 * Getter for all existing settings with name of setting as key.
 * @returns {object}
 */
SystemSettings.prototype.getAllSettings = function() {
    return this._settings;
};

/**
 * Merges default and existing settings:
 *  - Creates not existing default settings
 *  - Removes deleted default settings from database.
 * @this {SystemSettings}
 */
SystemSettings.prototype.merge = function(finishCallback) {
    //defaultKeys are those we need
    //keys are those we have in DB
    var defaultKeys = Object.keys(this._settingsDefault);
    var keys = Object.keys(this._settings);
    var calls = [];

    var that = this;

    //remove all entries of defaulKeys we already have in DB
    Array.removeAll(defaultKeys, keys);

    //save not existing entries to DB
    defaultKeys.forEach(function(defaultKey) {
        calls.push(function(callback) {
            that._settingsDefault[defaultKey].save(callback);
        });
    });

    //defaulKeys are those we need
    //keys are those we have in DB
    defaultKeys = Object.keys(this._settingsDefault);
    keys = Object.keys(this._settings);

    //remove all entries of keys we have in DB but don't have in defaulKeys as we don't require them anymore
    Array.removeAll(keys, defaultKeys);

    //remove not required entries of DB
    keys.forEach(function(key) {
        calls.push(function(callback) {
            that._settings[key].remove(callback);
        });
    });
    
    async.parallel(calls, function(err) {
        finishCallback(err);
    });
};

/**
 * Initializes settings.
 */
SystemSettings.init = function(finishCallback) {
    var systemSettings = new SystemSettings();

    Setting.find().exec(function(err, settings) {
        settings.forEach(function(setting){
            systemSettings.add(setting.name, setting);
        });

        systemSettings.merge(finishCallback);
    });
};

module.exports = SystemSettings;