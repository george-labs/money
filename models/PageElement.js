// structure of PageElements

var mongoose = require('mongoose')
    , PageElementProperty = require('./PageElementProperty')
    , Property = require('./Property')
    , Schema = mongoose.Schema
    , async = require('async');

var pageElementSchema = Schema({
    itemId: Number, // not needed anymore
    uid: String,
    pageElementProperties: [{ type: Schema.Types.ObjectId, ref: 'PageElementProperty' }],
    page: { type: Schema.Types.ObjectId, ref: 'Page' },
    element: { type: Schema.Types.ObjectId, ref: 'Element' },
    createdAt: { type: Date, default: Date.now }  // timestamp
});

pageElementSchema.methods.getSortedPageElementProperties = function() {
    return this.pageElementProperties.sort(function(a, b) {
        a = a.property.name.toLowerCase();
        b = b.property.name.toLowerCase();
        if (a < b) return 1;
        if (a > b) return -1;
        return 0;
    });
};

pageElementSchema.methods.getProperties = function() {
    var properties = this.getSortedPageElementProperties();
    var resultProperties = {};
    
    properties.forEach(function(property) {
        resultProperties[property.property.name] = property.value;

    });
    
    return resultProperties;
};

pageElementSchema.methods.getProperty = function(propertyName) {
    for (var i = this.pageElementProperties.length - 1; i >= 0; i -= 1) {
        if (this.pageElementProperties[i].property.name === propertyName) {
            return this.pageElementProperties[i];
        }
    }
    return null;
};

pageElementSchema.methods.setProperties = function(values, cb) {

    var that = this,
        calls = [];

    if (typeof cb === 'undefined') {
        cb = function(err, pageElementProperties){};
    }

    //Object.keys(object) returns all keys of the stored key/value pairs in object as forEach can not loop through an object
    Object.keys(values).forEach(function(name) {
        var value = values[name];
        calls.push(function(callback) {
            that.setProperty(name, value, callback);
        });
    });

    async.parallel(calls, function(err, result) {

        var realResult = [];
        if (result && result.length > 0) {
            result.forEach(function(value) {
                realResult.push(value[0]);
            });
        }

        cb(err, realResult);
    });
};

pageElementSchema.methods.setProperty = function(name, value, cb) {

    var that = this;

    if (typeof cb === 'undefined') {
        cb = function(err, pageElementProperty, name){};
    }

    Property.findOne({ name: name }).exec(function(err, property) {
        if (property) {
            var pageElementProperty = new PageElementProperty({
                property: property,
                value: value,
                pageElement: that
            });

            that.pageElementProperties.push(pageElementProperty);

            cb(err, pageElementProperty, name);
        } else {
            cb('Property named ' + name + ' does not exist', null, name);
        }
    });
};

module.exports = mongoose.model('PageElement', pageElementSchema);