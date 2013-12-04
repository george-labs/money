var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var elementSchema = Schema({
    name: String,
    properties: [{ type: Schema.Types.ObjectId, ref: 'Property' }]
});

module.exports = mongoose.model('Element', elementSchema);