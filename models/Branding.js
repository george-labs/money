var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var brandingSchema = Schema({
    name: String,
    label: String,
    inputType: String,
    value: String,
    description: String,
    sortOrder: Number
});

module.exports = mongoose.model('Branding', brandingSchema);