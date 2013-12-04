/*global */

/*
 * helper script which rebuilds the whole database
 */

'use strict';

/*
 * rather trickreich
 *
 * The specifications requires the ability to have a read-only state for public consumption
 * whilst still being able to edit the translations/colors/whatever,
 * To do so, a complete snapshot of all relevant data is created upon public release (go online)
 * The read-only data will be stored in models that have the exact same fields as their
 * editable counterparts and their names are the same, but with a 'Live' postfix.
 * eg. Page (readwrite) -> PageLive (readonly)
 *
 * also there is some inconsistency, since some of the live elements point to non-live models.
 * (PageElement points back to Page, PageElementLive also points to Page, whereas a reference to PageLive would be expected)
 * This is most probably a bug. But also, since it has not caused any problems yet, it is most probably irrelevant.
 *
 * The structure goes like this:
 *
 * Page
 *   name
 *   template
 *   sortOrder
 *   [PageElement] ------ PageElement
 *                          itemId
 *                          uid
 *                          page
 *                          [pageElementProperty] ------ PageElementProperty
 *                          element ---                    pageElement
 *                                    |                    property
 *                                    |                    value
 *                                    |
 *                                    ------------------- Element
 *                                                         name
 *                                                         [property] -------- Property
 *                                                                               name
 *                                                                               inputType
 *
 * PageLive
 *   name
 *   template
 *   sortOrder
 *   [PageElementLive] -- PageElementLive
 *                          itemId
 *                          uid
 *                          PAGE obacht!
 *                          [pageElementPropertyLive] -- PageElementPropertyLive
 *                          element ---                    pageElementLive
 *                                    |                    property
 *                                    |                    value
 *                                    |
 *                                    ------------------- Element
 *                                                         name
 *                                                         [property] -------- Property
 *                                                                               name
 *                                                                               inputType
 */

// REQUIREMENTS
var sys = require( 'sys' ),
    mongoose = require( 'mongoose' ),
    async = require( 'async' ),
    util = require( 'util' ),
    nconf = require( 'nconf' ),
    fs = require( 'fs' ),


    PageInit = require( '../init/PageInit' ),

    Setting = require( '../models/Setting' ),
    SettingLive = require( '../models/SettingLive' ),

    Branding = require( '../models/Branding' ),
    BrandingLive = require( '../models/BrandingLive' ),

    Page = require( '../models/Page' ),
    PageLive = require( '../models/PageLive' ),

    PageElement = require( '../models/PageElement' ),
    PageElementLive = require( '../models/PageElementLive' ),

    PageElementProperty = require( '../models/PageElementProperty' ),
    PageElementPropertyLive = require( '../models/PageElementPropertyLive' ),

    AppVersion = require( '../models/AppVersion' ),
    Element = require( '../models/Element' ),
    Property = require( '../models/Property' ),

    AppVersionDao = require( '../daos/AppVersionDao' );

// Read configuration (environment)
var Configuration = require( '../utils/Configuration' );
nconf.argv().env().file( { file: 'settings.json' } ).defaults( {
    'port': 8080,
    'database': {
        'host': '127.0.0.1',
        'port': 27017
    }
} );

// mongo config
var mongoconf = {
    db: {
        name: 'moneyfhc' + nconf.get( 'instance' ),
        host: nconf.get( 'database:host' ),
        port: nconf.get( 'database:port' )
    },
    secret: '98B43ACFB8A9720B19A1CB485C7117BA'
};


/*
 * called after the whole operation has finished
 */
function done() {
    console.log( 'DONE!' );
    process.exit( 0 );
}

function goLive() {
    console.log( 'going live' );
    var appVersionDao = new AppVersionDao();

    appVersionDao.createAppVersion( '', true, function( err, appVersion ) {
        appVersionDao.restoreVersion( appVersion._id, true, function() {
            done();
        }, true, true, true );
    } );
}

function updatePages() {
    var pageInit = new PageInit();
    pageInit.removeAndInitPages( function() {
        goLive();
    } );
}

// connect to the database
function connect() {
    console.log( 'connecting to', mongoconf.db );
    mongoose.connect( 'mongodb://' + mongoconf.db.host + ':' + mongoconf.db.port + '/moneyfhc' + nconf.get( 'instance' ) );
    var db = mongoose.connection;
    db.on( 'error', console.error.bind( console, 'connection error:' ) );
    db.once( 'open', updatePages );


}

/*
 * kicks off the rebuild process
 */
function rebuild() {
    console.log( 'rebuilding mongo!' );
    connect();
}

rebuild();