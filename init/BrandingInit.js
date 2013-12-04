var Array = require('../utils/ArrayExtension.js')
    , BrandingDao = require('../daos/BrandingDao')
    , Branding = require('../models/Branding.js')
    , BrandingLive = require('../models/BrandingLive.js')
    , CorporateIdentity = require('../utils/CorporateIdentity')
    , async = require('async');

var SystemBranding = function() {
    this._brandings = {};
    this._brandingsDefault = {};
    this.init();
};

SystemBranding.default = {
    BODY_COLOR: 'bodyColor',
    HEADER_COLOR: 'headerColor',
    HEADER_TEXT_COLOR: 'headerTextColor',
    URL: 'url',
    LOGO: 'logo'
};

SystemBranding.prototype.add = function(name, branding) {
    branding.name = name;
    this._brandings[name] = branding;
};

SystemBranding.prototype.addDefault = function(name, branding) {
    branding.name = name;
    this._brandingsDefault[name] = branding;
};

SystemBranding.prototype.init = function() {
    this.addDefault(SystemBranding.default.BODY_COLOR, new Branding({
        label: 'Application background color',
        inputType: 'text',
        value: CorporateIdentity.get(SystemBranding.default.BODY_COLOR),
        description: 'Use HEX value or color name.',
        sortOrder: 10
    }));
    this.addDefault(SystemBranding.default.HEADER_COLOR , new Branding({
        label: 'Corporate background color',
        inputType: 'text',
        value: CorporateIdentity.get(SystemBranding.default.HEADER_COLOR),
        description: 'Use HEX value or color name.',
        sortOrder: 20
    }));
    this.addDefault(SystemBranding.default.HEADER_TEXT_COLOR , new Branding({
        label: 'Corporate text color',
        inputType: 'text',
        value: CorporateIdentity.get(SystemBranding.default.HEADER_TEXT_COLOR),
        description: 'Use HEX value or color name.',
        sortOrder: 21
    }));
    this.addDefault(SystemBranding.default.URL, new Branding({
        label: 'Corporate website (URL)',
        inputType: 'url',
        value: '',
        description: 'URL to your corporate website.',
        sortOrder: 30
    }));
    this.addDefault(SystemBranding.default.LOGO, new Branding({
        label: 'Corporate logo (file upload)',
        inputType: 'file',
        value: CorporateIdentity.get(SystemBranding.default.LOGO),
        description: 'Add your company logo.',
        sortOrder: 40
    }));
};

SystemBranding.prototype.getAllbrandings = function() {
    return this._brandings;
};

SystemBranding.prototype.merge = function(finishCallback) {
    var that = this;
    var calls = [];

    //defaulKeys are those we need
    //keys are those we have in DB
    var defaultKeys = Object.keys(this._brandingsDefault);
    var keys = Object.keys(this._brandings);

    //remove all entries of defaulKeys we already have in DB
    Array.removeAll(defaultKeys, keys);

    //save not existing entries to DB
    defaultKeys.forEach(function(defaultKey) {
        calls.push(function(callback) {
            that._brandingsDefault[defaultKey].save(callback);
        });
    });

    //defaulKeys are those we need
    //keys are those we have in DB
    defaultKeys = Object.keys(this._brandingsDefault);
    keys = Object.keys(this._brandings);

    //remove all entries of keys we have in DB but don't have in defaulKeys as we don't require them anymore
    Array.removeAll(keys, defaultKeys);

    //remove not required entries of DB
    keys.forEach(function(key) {
        calls.push(function(callback) {
            that._brandings[key].remove(callback);
        });
    });
    
    async.parallel(calls, function(err) {
        finishCallback(err);
    });
};

SystemBranding.init = function(finishCallback) {
    var calls = [];
    calls.push(function(callback) {
        BrandingLive.find().exec(function(err, brandings) {
            new BrandingDao(true).recreateCss(brandings, callback);
        });
    });
    calls.push(function(callback) {
        var systemBranding = new SystemBranding();
        Branding.find().exec(function(err, brandings) {
            brandings.forEach(function(branding) {
                systemBranding.add(branding.name, branding);
            });
            systemBranding.merge(function () {
                new BrandingDao(false).recreateCss(brandings, callback);
            });
        });
    });
    async.parallel(calls, finishCallback);
};

module.exports = SystemBranding;