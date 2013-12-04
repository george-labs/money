'use strict';

var Setting = require ('../models/Setting')
    , SettingLive = require ('../models/SettingLive')
    , Page = require ('../models/Page')
    , PageElement = require ('../models/PageElement')
    , PageElementProperty = require ('../models/PageElementProperty')
    , PageLive = require ('../models/PageLive')
    , PageElementLive = require ('../models/PageElementLive')
    , PageElementPropertyLive = require ('../models/PageElementPropertyLive')
    , Branding = require ('../models/Branding')
    , BrandingLive = require ('../models/BrandingLive')
    , Configuration = require ('../utils/Configuration')
    , Calculation = require ('../utils/Calculation')
    , async = require ('async')
    , jade = require ('jade')
    , mongoose = require ('mongoose')
    , ObjectId = mongoose.Types.ObjectId
    , statsSession = mongoose.model ('StatsSession')
    , statsResult = mongoose.model('StatsResult')
    , PageElementDao = require ('../daos/PageElementDao');

var pageElementDao = new PageElementDao (false);

var IndexController = {

    indexAction: function (showAdminInterface) {

        var models = {
            edit: {
                Page: Page,
                PageElement: PageElement,
                PageElementProperty: PageElementProperty,
                Setting: Setting,
                Branding: Branding
            },
            live: {
                Page: PageLive,
                PageElement: PageElementLive,
                PageElementProperty: PageElementPropertyLive,
                Setting: SettingLive,
                Branding: BrandingLive
            }
        };

        return function (req, res) {

            var mode = showAdminInterface ? 'edit' : 'live',
                name = req.params.page;

            if (typeof name === 'undefined') {
                if (showAdminInterface) {
                    res.redirect ('/translations/welcome');
                } else {
                    var param = [
                        ['cid'],
                        ['logo'],
                        ['bg', 'headerColor'],
                        ['text', 'headerTextColor'],
                        ['url']
                    ];
                    for (var i = param.length - 1; i >= 0; i -= 1) {
                        if (req.query[param[i][0]]) {
                            req.session[param[i][param[i].length - 1]] = req.query[param[i][0]];
                        }
                    }
                    statsSession.syncCurrent (req);
                    res.redirect ('/welcome');
                }
                return;
            }

            // get the page by name
            models[mode].Page.findOne ({ name: name }).populate ('pageElements').exec (function (err, page) {

                if (page === null) {
                    res.redirect ('/error'); // 404
                    return;
                }

                var isAdmin = req.isAuthenticated () && showAdminInterface,
                    data = {
                        settings: {},
                        brandings: {},
                        pages: {
                            byName: {},
                            current: page,
                            currentElementsByName: {},
                            prev: undefined,
                            next: undefined
                        }
                    };

                async.parallel ([

                    function loadPages (callback) {
                        // populate the elements of the page
                        IndexController.populatePageElements (data.pages.current, models, mode, function (err, page) {
                            // get ALL pages
                            models[mode].Page.find ().populate ('pageElements').sort ({sortOrder: 'ASC'}).exec (function (err, pages) {
                                // make a hash of all the pages elements {key: element.uid, value:element}
                                for (var pe in page.pageElements) {
                                    if (page.pageElements.hasOwnProperty (pe)) {
                                        if (typeof page.pageElements[pe].uid !== 'undefined') {
                                            data.pages.currentElementsByName[page.pageElements[pe].uid] = page.pageElements[pe];
                                        }
                                    }
                                }
                                // set the previous and next page
                                for (var i = 0; i < pages.length; i += 1) {
                                    if (String (page._id) === String (pages[i]._id)) {
                                        data.pages.prev = pages[i - 1];
                                        data.pages.next = pages[i + 1];
                                    }
                                }
                                // create a hash of all pages {key: page.name, value:page}
                                for (var p in pages) {
                                    if (pages.hasOwnProperty (p)) {
                                        data.pages.byName[pages[p].name] = pages[p];
                                    }
                                }
                                // populate the menu page
                                IndexController.populatePageElements (data.pages.byName['sitemap'], models, mode, function (err, menuPage) {
                                    data.pages.menu = menuPage;
                                    callback();
                                });
                            });
                        });
                    },

                    function loadSettings (callback) {
                        models[mode].Setting.find ().exec (function (err, settings) {
                            data.settings = settings;
                            callback();
                        });
                    },

                    function loadBrandings (callback) {
                        models[mode].Branding.find ().exec (function (err, brandings) {
                            data.brandings = brandings;
                            callback();
                        });
                    },

                    function trackProgress (callback) {
                        var calls = [];
                        if (!isAdmin) {
                            // update session.progress
                            statsSession.syncCurrent(req, { progress: page.name });
                            if (req.method === 'POST' && req.body.q) {
                                // store answers
                                calls.push(function (callback) {
                                    Calculation.store(req, callback);
                                });
                            }
                            if (page.name === 'get-ready') {
                                // start over
                                calls.push(function (callback) {
                                    Calculation.reset(req, callback);
                                });
                            } else if (page.name === 'result') {
                                // prepare result
                                if (!req.session['result']) {
                                    calls.push(function (callback) {
                                        var result = {};
                                        statsResult.retrieveDistribution(function (err, distribution) {
                                            result.percentage = distribution;
                                            req.session['result'] = result;
                                            callback();
                                        });
                                    });
                                }
                                // update result
                                calls.push(function (callback) {
                                    Calculation.update(req, function () {
                                        // update session.result
                                        statsSession.syncCurrent(req, { persona: req.session['result'].persona });
                                        callback();
                                    });
                                });
                            }
                        }
                        async.series(calls, callback);
                    }

                ], function renderPage (err) {

                    res.render (page.template, {
                        config: Configuration.render (req),
                        isAdmin: isAdmin,
                        settings: data.settings,
                        brandings: data.brandings,
                        pages: data.pages.byName,
                        menuPage: data.pages.menu,
                        nextPage: data.pages.next,
                        page: data.pages.current,
                        pageElements: data.pages.currentElementsByName,
                        result: req.session['result']
                    });

                });

            });

        };
    },

    populatePageElements: function (page, models, mode, finishCallback) {
        var calls = [];

        page.pageElements.forEach (function (pageElement) {
            calls.push (function (callback) {
                models[mode].PageElement.populate (
                    pageElement,
                    'pageElementProperties element',
                    callback
                );
            });
        });

        async.parallel (calls, function (err, result) {

            var calls = [];
            result.forEach (function (pageElement) {
                pageElement.pageElementProperties.forEach (
                    function (pageElementProperty) {
                        calls.push (function (callback) {
                            models[mode].PageElementProperty.populate (
                                pageElementProperty,
                                'property',
                                callback
                            );
                        });
                    }
                );
            });

            async.parallel (calls, function (err, result) {
                finishCallback (err, page);
            });

        });
    },

    pageNotFoundAction: function (req, res) {
        res.redirect ('/error'); // 404
    },

    pageElementFormAction: function (req, res) {
        var id = req.body.id;
        var versionCount = 0;
        var rootVersion;
        if (typeof req.body.versions !== 'undefined') {
            versionCount = parseInt(req.body.versions, 10);
        }
        IndexController.loadPageElement(id, function (err, pageElement) {
            pageElementDao.findVersions(pageElement._id, function (err, versions) {
                rootVersion = null;
                if (versions.length > 0) {
                    rootVersion = versions[versions.length - 1];
                } else {
                    console.warn('Missing rootVersion for %s', JSON.stringify(versions));
                    rootVersion = pageElement;
                }
                res.render ('pageElementForm', {
                    pageElement: pageElement,
                    versions: versions,
                    rootVersion: rootVersion,
                    versionCount: versionCount
                });
            });
        });
    },

    loadPageElement: function (id, callback) {
        PageElement.findById(id).populate(['pageElementProperties', 'element']).exec(function (err, pageElement) {
            var calls = [];
            if (pageElement) {
                pageElement.pageElementProperties.forEach(function (pageElementProperty) {
                    calls.push(function (callback) {
                        PageElementProperty.populate(pageElementProperty, 'property', callback);
                    });
                });
                async.parallel(calls, function (err, pageElementProperties) {
                    callback(err, pageElement);
                });
            } else {
                callback(err, null);
            }
        });
    },

    pageElementSaveAction: function (req, res) {
        var id = req.body.id,
            value = req.body.value,
            resBody = { status: 'ERR' },
            calls = [];
        if (id) {
            calls.push(function (callback) {
                PageElementProperty.findById(id).populate(['pageElement']).exec(function (err, pageElementProperty) {
                    if (pageElementProperty) {
                        pageElementProperty.value = value;

                        pageElementProperty.save(function (err, pageElementProperty) {
                            if (pageElementProperty) {
                                resBody.status = 'OK';
                            }
                            callback(err, pageElementProperty);
                        });
                    }
                });
            });
        }
        async.parallel(calls, function (err, pageElementProperty) {
            IndexController.loadPageElement(pageElementProperty[0].pageElement._id, function (err, pageElement) {
                if (pageElement) {
                    jade.renderFile ('views/elements/element.jade', {
                            pageElement: pageElement,
                            isAdmin: req.isAuthenticated()
                        },
                        function (err, html) {
                            if (err) {
                                throw err;
                            }
                            resBody.html = html;
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.write(JSON.stringify(resBody));
                            res.end();
                        }
                    );
                }
            });
        });
    },

    createPageElementVersionAction: function (req, res) {
        var resBody = { status: 'ERR' };
        var id = req.body.id;

        if (typeof id !== 'undefined') {
            pageElementDao.findById (id, function (err, pageElement) {
                pageElementDao.save(pageElement, function (err, pageElement) {
                    resBody.status = 'OK';
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(resBody));
                    res.end();
                });
            });
        }
    },

    restorePageElementVersion: function (req, res) {
        var id = req.body.id;
        var version = req.body.version;
        var resBody = { status: 'ERR' };

        if (typeof id !== 'undefined' && typeof version !== 'undefined') {
            pageElementDao.restoreVersion (version, function (err, pageElement) {
                IndexController.loadPageElement (pageElement._id, function (err, pageElement) {
                    resBody.status = 'OK';
                    jade.renderFile ('views/elements/element.jade', {
                            pageElement: pageElement,
                            isAdmin: req.isAuthenticated ()
                        },
                        function (err, html) {
                            if (err) {
                                throw err;
                            }
                            resBody.html = html;
                            res.writeHead (200, {'Content-Type': 'application/json'});
                            res.write (JSON.stringify (resBody));
                            res.end ();
                        }
                    );
                });
            }, false);
        }
    },

    removePageElementVersionAction: function (req, res) {
        var id = req.body.id;
        var resBody = { status: 'ERR' };

        if (typeof id !== 'undefined') {
            pageElementDao.removeVersion (id, function (err) {
                resBody.status = 'OK';
                res.writeHead (200, {'Content-Type': 'application/json'});
                res.write (JSON.stringify (resBody));
                res.end ();
            });
        }
    },

    forwardAction: function (req, res) {
        var target = req.query.url;
        if (target) {
            statsSession.syncCurrent(req, { clicked: 'whatToDoNext' });
            res.redirect(target);
        } else {
            res.redirect('/error');
        }
    },

    shareAction: function (req, res) {
        var services = {
                facebook: { track: 'shareOnFacebook', forward: 'https://www.facebook.com/sharer/sharer.php?u={url}' },
                googleplus: { track: 'shareOnGooglePlus', forward: 'https://plus.google.com/share?url={url}' },
                twitter: { track: 'shareOnTwitter', forward: 'https://twitter.com/share?url={url}' }
            },
            service = req.params.service || 'notFound';
        if (services[service]) {
            statsSession.syncCurrent(req, { clicked: services[service].track });
            res.redirect(services[service].forward.replace(/\{url\}/, encodeURIComponent(Configuration.render(req).url)));
        } else {
            res.redirect('/error');
        }
    }

};

module.exports = IndexController;