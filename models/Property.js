var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var propertySchema = Schema({
    name: String,
    inputType: String
});

module.exports = mongoose.model('Property', propertySchema);