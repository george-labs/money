// structure of PageElements Versions

var mongoose = require('mongoose')
    , PageElementProperty = require('./PageElementProperty')
    , Property = require('./Property')
    , Schema = mongoose.Schema
    , async = require('async');

var pageElementVersionSchema = Schema({
    pageElementProperties: [Schema.Types.Mixed],
    refId: { type: Schema.Types.ObjectId, ref: 'PageElement' },
    createdAt: { type: Date, default: Date.now }  // timestamp
});

pageElementVersionSchema.methods.getProperty = function(propertyName) {
    for (var i in this.pageElementProperties) {
        if (this.pageElementProperties[i].name === propertyName) {
            return this.pageElementProperties[i];
        }
    }

    return null;
};

module.exports = mongoose.model('PageElementVersion', pageElementVersionSchema);