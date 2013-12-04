var PageElement = require('../models/PageElement')
  , PageElementProperty = require('../models/PageElementProperty')
  , PageElementVersion = require('../models/PageElementVersion')
  , PageElementLive = require('../models/PageElementLive')
  , PageElementPropertyLive = require('../models/PageElementPropertyLive')
  , async = require('async');


/**
 * Creates a new instance of PageElementDao.
 *
 * @constructor
 * @this {PageElementDao}
 * @param {boolean} Whether or not live version should be used.
 */
function PageElementDao(live) {
    if (live) {
        this.models = {
            PageElement: PageElementLive,
            PageElementProperty: PageElementPropertyLive
        }
    } else {
        this.models = {
            PageElement: PageElement,
            PageElementProperty: PageElementProperty
        }
    }

    this.live = live;
};

/**
 * Creates a new version of a PageElement.
 *
 * @this {PageElementDao}
 * @param {PageElement} pageElement PageElement object to save
 * @param {boolean} createVersion Whether or not a version should be created
 * @param {function} callback Callback invoked after save process
 */
PageElementDao.prototype.save = function (pageElement, callback, createVersion) {
    var that = this;
    if (typeof createVersion === 'undefined') {
        createVersion = true;
    }

    if (createVersion && !this.live) {
        pageElement.save(function(err, pageElement) {
            that.models.PageElementProperty.find({ pageElement: pageElement._id }).populate('property').exec(
                function(err, pageElementProperties) {
                    var versionedPageElementProperties = [];

                    pageElementProperties.forEach(function (pageElementProperty) {
                        var versionedPageElementProperty = {};
                        versionedPageElementProperty._id = pageElementProperty._id;
                        versionedPageElementProperty.value = pageElementProperty.value;
                        versionedPageElementProperty.name = pageElementProperty.property.name;
                        versionedPageElementProperties.push(versionedPageElementProperty);
                    });

                    var pageElementVersion = new PageElementVersion({
                        refId: pageElement._id,
                        pageElementProperties: versionedPageElementProperties
                    });
                    pageElementVersion.save(function(err, pageElementVersion) {
                        if (err) {
                            console.error(err);
                        }
                        pageElement.save(callback);
                    });
                }
            );
        });
    } else {
        pageElement.save(callback);
    }
};

PageElementDao.prototype.saveAll = function(pageElements, finalCallback, createVersion, firstSave) {
    var calls = [];
    var that = this;

    pageElements.forEach(function(pageElement) {
        calls.push(function(callback) {
            that.save(pageElement, callback, createVersion);
        });
    });

    async.parallel(calls, finalCallback);
};

/**
 * Searches all versions of a PageElement and provides it in callback.
 *
 * @this {PageElementDao}
 * @param {mixed} pageElement PageElement or id of PageElement
 * @param {function} callback Callback invoked with PageElementVersions
 */
PageElementDao.prototype.findVersions = function (pageElement, callback) {
    var id = pageElement;

    if (typeof pageElement._id !== 'undefined') {
        id = pageElement._id;
    }

    PageElementVersion.find({ refId: id }).sort({ createdAt: 'descending' }).exec(function(err, versions) {
        if (err) {
            console.error(err);
        }
        callback(err, versions);
    });
};

/**
 * Searches a PageElement by its id.
 *
 * @this {PageElementDao}
 * @param {string} id Id of PageElement
 * @param {function} callback Callback invoked after PageElement was found
 */
PageElementDao.prototype.findById = function(id, callback) {
    this.models.PageElement.findById(id).exec(callback);
};

/**
 * Restores a PageElement version.
 *
 * @this {PageElementDao}
 * @param {string} id Id of PageElement version
 * @param {function} finalCallback Callback invoked after version is restored
 * @param {boolean} asNewVersion Whether or not the restored version should be a new version
 */
PageElementDao.prototype.restoreVersion = function(id, finalCallback, asNewVersion) {
    var that = this;
    PageElementVersion.findById(id).populate('refId').exec(function (err, pageElementVersion) {
        var pageElement = pageElementVersion.refId;
        var savePEProperties = {};
        var ids = [];

        pageElementVersion.pageElementProperties.forEach(function (pageElementProperty) {
            ids.push(pageElementProperty._id);
        });

        that.models.PageElementProperty.find({ _id: { $in: ids } }).exec(function (err, peProperties) {
            peProperties.forEach(function (peProperty) {
                savePEProperties[peProperty._id] = peProperty;
            });

            pageElementVersion.pageElementProperties.forEach(function (pageElementProperty) {
                savePEProperties[pageElementProperty._id].value = pageElementProperty.value;
            });

            var calls = [];
            for (var i in savePEProperties) {
                calls.push(function (callback) {
                    savePEProperties[i].save(callback);
                });
            }

            async.parallel(calls, function (err, pageElementProperties) {
                that.save(pageElement, finalCallback, asNewVersion);
            });
        });
    });
};

PageElementDao.prototype.removeVersion = function (id, callback) {
    PageElementVersion.findByIdAndRemove(id, callback);
};

module.exports = PageElementDao;