var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var brandingVersionSchema = Schema({
    value: String,
    refId: { type: Schema.Types.ObjectId, ref: 'Branding' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BrandingVersion', brandingVersionSchema);