var check = require('validator').check
    , Setting = require('../models/Setting')
    , SettingDao = require('../daos/SettingDao')
    , Configuration = require('../utils/Configuration');

var settingDao = new SettingDao();

SettingsController = {
    indexAction: function(req, res) {
        Setting.find().sort('sortOrder').exec(function(err, settings) {
            res.render('settings', {
                config: Configuration.render(req),
                settings: settings,
                isAdmin: req.isAuthenticated()
            });
        });
    },

    saveSettingAction: function(req, res) {
        var resBody = {
            status: 'ERR',
            message: ''
        };

        Setting.findOne({name: req.body.name}).exec(function(err, setting) {
            if (setting) {

                var success = true;

                /*
                if (setting.inputType === 'email') {

                    try {
                        check(req.body.value).isEmail();
                    } catch (e) {
                        success = false;
                        resBody.message = 'Invalid E-Mail address';
                    }
                }
                */

                if (success) {
                    resBody.status = 'OK';
                    setting.value = req.body.value;
                    settingDao.save(setting);
                }
            }

            if (err) {
                resBody.status = 'ERR';
            }

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resBody));
            res.end();
        });
    }
};

module.exports = SettingsController;