var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// Models
var pageSchema = Schema({
    name: String,
    template: String,
    sortOrder: Number,
    pageElements: [{ type: Schema.Types.ObjectId, ref: 'PageElement' }]
});

pageSchema.methods.getElement = function(exactName) {
    if (typeof exactName === 'string') {
        for (var i = this.pageElements.length - 1; i >= 0; i -= 1) {
            if (exactName === this.pageElements[i].uid) {
                return this.pageElements[i];
            }
        }
    }
    return undefined;
};

pageSchema.methods.getElements = function(startingWith) {
    var elements = [];
    this.pageElements.forEach(function(pageElement) {
        if (typeof startingWith === 'undefined' || pageElement.uid.indexOf(startingWith) === 0) {
            elements.push(pageElement);
        }
    });
    return elements;
};

module.exports = mongoose.model('Page', pageSchema);