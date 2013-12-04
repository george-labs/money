var check = require('validator').check
    , Page = require ('../models/Page')
    , PageElement = require ('../models/PageElement')
    , PageElementProperty = require ('../models/PageElementProperty')
    , Branding = require('../models/Branding')
    , BrandingDao = require('../daos/BrandingDao')
    , fs = require('fs')
    , async = require('async')
    , IndexController = require ('../routes/index')
    , Configuration = require('../utils/Configuration')
    , CorporateIdentity = require('../utils/CorporateIdentity');

var brandingDao = new BrandingDao();

BrandingsController = {

    indexAction: function(req, res) {

        var mode = 'edit',
            models = {
                edit: {
                    Page: Page,
                    PageElement: PageElement,
                    PageElementProperty: PageElementProperty
                }
            };

        var isAdmin = req.isAuthenticated(),
            data = {
                brandings: {},
                pages: {}
            };

        async.parallel ([

            function loadMenuPage (callback) {
                // populate the menu page
                models[mode].Page.findOne ({ name: 'sitemap' }).populate ('pageElements').exec (function (err, page) {
                    IndexController.populatePageElements (page, models, mode, function (err, menuPage) {
                        data.pages.menu = menuPage;
                        callback();
                    });
                });
            },

            function loadBrandings (callback) {
                brandingDao.findAll(function(err, brandings) {
                    data.brandings = brandings;
                    callback();
                });
            }

        ], function renderPage (err) {

            res.render ('branding', {
                config: Configuration.render (req),
                isAdmin: isAdmin,
                brandings: data.brandings,
                menuPage: data.pages.menu
            });

        });

    },

    saveBrandingAction: function(req, res) {
        var resBody = {
            status: 'ERR',
            message: ''
        };

        var defaultValues = {
            headerColor: CorporateIdentity.get('headerColor'),
            headerTextColor: CorporateIdentity.get('headerTextColor'),
            bodyColor: CorporateIdentity.get('bodyColor'),
            logo: CorporateIdentity.get('logo')
        };

        var name = req.body.name;
        var calls = [];
        var contentType = 'application/json';

        Branding.findOne({ name: name }).exec(function(err, branding) {

            if (branding) {
                var success = true;

                if (branding.inputType === 'file') {
                    var file = req.files.value,
                        extension = file.name.slice(file.name.lastIndexOf('.'));
                    branding.value = '/img/branding_' + (new Date().getTime()) + extension;
                    contentType = 'text/html'; //fake for IE(8)
                    calls.push(function(callback) {
                        fs.readFile(file.path, function (err, data) {
                            var targetPath = 'public' + branding.value;
                            fs.writeFile(targetPath, data, callback);
                        });
                    });
                } else if (branding.inputType === 'url') {
                    try {
                        check(req.body.value).isUrl();
                        branding.value = req.body.value;
                    } catch (e) {
                        success = false;
                        resBody.message = 'Invalid URL';
                    }
                } else {
                    branding.value = req.body.value;
                }

                if (req.body.value === '' && typeof defaultValues[name] !== 'undefined') {
                    branding.value = defaultValues[name];
                }

                calls.push(function(callback) {
                    if (success) {
                        resBody.status = 'OK';
                        resBody.value = branding.value;
                        brandingDao.save(branding, callback);
                    }
                });
            }

            if (err) {
                resBody.status = 'ERR';
                resBody.error = err;
            }

            async.parallel(calls, function(err, data) {
                if (err) {
                    resBody.status = 'ERR';
                    resBody.error = err;
                }

                res.writeHead(200, {'Content-Type': contentType});
                res.write(JSON.stringify(resBody));
                res.end();
            });
        });
    }
};

module.exports = BrandingsController;