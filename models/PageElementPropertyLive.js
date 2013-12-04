// values stored in PageElements

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var pageElementPropertyLiveSchema = Schema({
    pageElement: { type: Schema.Types.ObjectId, ref: 'PageElementLive' },
	property: { type: Schema.Types.ObjectId, ref: 'Property' },
	value: String
});

module.exports = mongoose.model('PageElementPropertyLive', pageElementPropertyLiveSchema);