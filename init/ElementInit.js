var Element = require('../models/Element')
  , Property = require('../models/Property')
  , async = require('async')
  , fs = require('fs');


exports.init = function(finishCallback) {
    Element.find().exec(function(err, elements) {
        if (elements && elements.length === 0) {

            fs.readFile(__dirname + '/../data/elements.json', 'utf8', function (err, data) {
                var calls = [];
                var properties = {};

                data = JSON.parse(data);

                data.properties.forEach(function(item) {
                    var name = item.name;
                    calls.push(function(callback) {
                        var property = new Property({
                            name: name,
                            inputType: item.inputType
                        });

                        property.save(function(err, dbProperty) {
                            if (err) throw err;

                            properties[dbProperty.name] = dbProperty;
                            callback(err, property);
                        });
                    });
                });

                async.parallel(calls, function(err, dbProperties) {
                    var calls = [];

                    data.elements.forEach(function(item) {
                        calls.push(function(callback) {
                            var element = new Element({
                                name: item.name
                            });
                            element.properties = [];
                            for (var j in item.properties) {
                                element.properties.push(properties[item.properties[j]]);
                            }
                            element.save(callback);
                        });
                    });

                    async.parallel(calls, finishCallback);
                });
            });

        } else {
            finishCallback(null);
        }
    });
};