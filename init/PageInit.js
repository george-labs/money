var Page = require('../models/Page')
    , PageElementProperty = require('../models/PageElementProperty')
    , PageElement = require('../models/PageElement')
    , Element = require('../models/Element')
    , Property = require('../models/Element')
    , PageElementDao = require('../daos/PageElementDao')
    , async = require('async')
    , fs = require('fs');

var pageElementDao = new PageElementDao();

/**
 * Constructor of class PageInit.
 * Initialises needed vars.
 */
var PageInit = function() {
    this.__namedElements = {};
    this.__namedProperties = {};
    this.__autoId = 1;
};

/**
 * For production environment! Creates the init pages only if there is no existing page in the database.
 * @this {PageInit}
 */
PageInit.prototype.initPages = function(finishCallback) {
    var that = this;

    Page.find().exec(function(err, pages) {
        Element.find().exec(function(err, elements) {
            Property.find().exec(function(err, properties) {
                elements.forEach(function(element) {
                    that.__namedElements[element.name] = element;
                });

                properties.forEach(function(property) {
                    that.__namedProperties[property.name] = property;
                });
                
                if (pages && pages.length === 0 &&
                    elements && elements.length !== 0 &&
                    properties && properties.length !== 0) {
                    that.createInitPages(finishCallback);
                }
            });
        });
    });
};

/**
 * For development environment only! Removes all existing pages, page elements and
 * page element properties before it creates the init pages.
 */
PageInit.prototype.removeAndInitPages = function(finishCallback) {
    var that = this;
    Page.find().exec(function(err, pages) {
        for (var i in pages) {
            pages[i].remove();
        }

        PageElement.find().exec(function(err, pages) {
            for (var i in pages) {
                pages[i].remove();
            }
            PageElementProperty.find().exec(function(err, pages) {
                for (var i in pages) {
                    pages[i].remove();
                }
                that.initPages(finishCallback);
            });
        });
    });

};

/**
 * Use this method to create pages that should be present at application startup.
 * Use the createPage method to create new pages.
 * @this {PageInit}
 */
PageInit.prototype.createInitPages = function(finishCallback) {

    var that = this;
    var content = null;
    
    fs.readFile(__dirname + '/../data/pages.json', 'utf8', function (err, data) {
        if (err) {
            return;
        }
        
        content = JSON.parse(data);
        
        var calls = [];
        
        if (content) {
            content.pages.forEach(function(item, index) {
                calls.push(function(callback) {
                    that.createPage(item.name, item.template, item.elements, index, callback);
                });
            });
        }
        
        async.parallel(calls, finishCallback);
    });
};

/**
 * Creates a new page with given page elements and properties.
 *
 * Elements should contain the following structure:
 * {
 *		name: ...			// name of the element
 *		properties: [
 *			{
 *				name: ...	// name of the property
 *				value: ...	// property value
 *			}
 *		]	
 * }
 *
 * @this {PageInit}
 * @param {string} pageName
 * @param {array} elements Page elements
 */
PageInit.prototype.createPage = function(pageName, template, elements, sortOrder, finishCallback) {
    var that = this;
    var page = new Page({
        name: pageName,
        template: template,
        sortOrder: sortOrder
    });
    var propertySaveCbs = [];

    elements.forEach(function(element) {
        var dbElement = new PageElement({
            itemId: 0,
            element: that.__namedElements[element.name],
            uid: ((typeof element.uid !== 'undefined') ? element.uid : 'element' + that.__autoId++)
        });

        var transformedProperties = {};
        element.properties.forEach(function(property) {
            transformedProperties[property.name] = property.value;
        });

        propertySaveCbs.push(function(callback) {
            dbElement.setProperties(transformedProperties, function(err, props) {

                if (err) {
                    throw err;
                }

                var calls = [];

                props.forEach(function(prop) {
                    calls.push(function(callbackInner) {
                        prop.save(callbackInner);
                    });
                });

                async.parallel(calls, function(err, props) {
                    dbElement.save(function(err, dbElement) {
                        pageElementDao.save(dbElement, callback);
                    });
                });

            });
        });
    });

    async.parallel(propertySaveCbs, function(err, elements) {
        var savedElements = [];

        elements.forEach(function(elementArray) {
            savedElements.push(elementArray[0]);
        });

        page.pageElements = savedElements;
        page.save(finishCallback);
    });
};

/**
 * Initialises the default pages.
 */
PageInit.init = function(finishCallback) {
    var pageInit = new PageInit();
    pageInit.initPages(finishCallback);
};

module.exports = PageInit;