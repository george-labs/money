var Branding = require('../models/Branding')
    , BrandingLive = require('../models/BrandingLive')
    , BrandingVersion = require('../models/BrandingVersion')
    , CorporateIdentity = require('../utils/CorporateIdentity')
    , async = require('async')
    , fs = require('fs');

/**
 * Creates a new instance of BrandingDao.
 *
 * @constructor
 * @this {BrandingDao}
 * @param {boolean} live Whether or not live tables should be used.
 */
function BrandingDao(live) {

    if (typeof live === 'undefined') {
        live = false;
    }

    if (live) {
        this.models = {
            Branding: BrandingLive
        }
    } else {
        this.models = {
            Branding: Branding
        }
    }
    this.live = live;
};

/**
 * Fetches all brandings from database and invokes the callback in success and error case.
 *
 * @this {BrandingDao}
 * @param {function} callback Callback function
 */
BrandingDao.prototype.findAll = function(callback) {
    this.models.Branding.find().sort({sortOrder: 'ASC'}).exec(callback);
};

/**
 * Saves all the given brandings.
 *
 * @this {BrandingDao}
 * @param {array} brandings Array containing brandings
 * @param {function} callback Callback invoked after save process
 * @param {boolean} recreateCss Whether or not the css file should be recreated
 */
BrandingDao.prototype.saveAll = function(brandings, callback, recreateCss) {
    var that = this;
    var calls = [];

    if (typeof recreateCss === 'undefined') {
        recreateCss = true;
    }

    if (typeof callback === 'undefined') {
        callback = function (err, brandings){};
    }

    brandings.forEach(function(branding) {
        calls.push(function(saveCallback) {
            that.save(branding, saveCallback, false);
        });
    });

    async.parallel(calls, function(err, brandings) {
        if (!recreateCss) {
            callback(err, brandings);
        } else {
            that.recreateCss(brandings, function(errCss, cssContent) {
                callback(err, brandings);
            });
        }
    });
};

/**
 * Saves a given branding.
 *
 * @this {BrandingDao}
 * @param {Branding} branding Branding
 * @param {function} callback Callback function
 * @param {boolean} Whether or not css file should be recreated
 * @param {boolean} createVersion Whether or not a new version should be created before save process
 */
BrandingDao.prototype.save = function(branding, finalCallback, recreateCss, createVersion) {
    var that = this;
    if (typeof recreateCss === 'undefined') {
        recreateCss = true;
    }

    if (typeof createVersion === 'undefined') {
        createVersion = true;
    }

    if (typeof finalCallback === 'undefined') {
        finalCallback = function (err, branding){};
    }

    async.series([
        function (callback) {
            if (createVersion) {
                that.models.Branding.findById(branding._id).exec(function (err, branding) {
                    if (branding) {
                        brandingVersion = new BrandingVersion();
                        brandingVersion.refId = branding;
                        brandingVersion.value = branding.value;
                        brandingVersion.save(callback);
                    } else {
                        callback(err, null);
                    }
                });
            } else {
                callback(null, null);
            }
        },
        function (callback) {
            branding.save(function(err, branding) {
                if (!recreateCss) {
                    callback(err, branding);
                } else {
                    that.findAll(function (err, brandings) {
                        that.recreateCss(brandings, function(errCss, cssContent) {
                            callback(err, branding);
                        });
                    });
                }
            });
        }
    ], function (err) {
        finalCallback(err, branding);
    });
};

/**
 * Recreates the css file using branding css properties.
 *
 * @this {BrandingDao}
 * @param {array} brandings Array containing all brandings
 * @param {function} callback Callback invoked after recreation
 */
BrandingDao.prototype.recreateCss = function(brandings, callback) {
    var dao = this,
        cssContent = [];
    if (brandings) {
        brandings.forEach(function (branding) {
            if (branding.value != '') {
                CorporateIdentity.set(dao.live, branding.name, branding.value);
                if (branding.name === 'bodyColor') {
                    cssContent.push('html{background-color:' + branding.value + '}');
                } else if (branding.name === 'headerColor') {
                    cssContent.push('header{background-color:' + branding.value + '}');
                } else if (branding.name === 'headerTextColor') {
                    cssContent.push('.branding-text{color:' + branding.value + '}');
                }
            }
        });
    }
    if (dao.live) {
        callback();
    } else {
        fs.writeFile('public/css/branding.css', cssContent.join('\n'), {}, callback);
    }
};

/**
 * Restores a BrandingVersion by prodiving its id.
 *
 * @this {BrandingDao}
 * @param {string} id Id of BrandingVersion
 * @param {function} callback Callback function
 */
BrandingDao.prototype.restoreVersion = function (id, callback) {
    var that = this;
    BrandingVersion.findById(id).populate('refId').exec(function (err, brandingVersion) {
        var branding = brandingVersion.refId;
        branding.value = brandingVersion.value;
        that.save(branding, callback);
    });
};

module.exports = BrandingDao;