// values stored in PageElements

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var pageElementPropertySchema = Schema({
    pageElement: { type: Schema.Types.ObjectId, ref: 'PageElement' },
	property: { type: Schema.Types.ObjectId, ref: 'Property' },
	value: String
});

module.exports = mongoose.model('PageElementProperty', pageElementPropertySchema);