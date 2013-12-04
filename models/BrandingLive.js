var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var brandingLiveSchema = Schema({
    name: String,
    label: String,
    inputType: String,
    value: String,
    description: String,
    sortOrder: Number
});

module.exports = mongoose.model('BrandingLive', brandingLiveSchema);