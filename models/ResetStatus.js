var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var resetStatusSchema = Schema({
    status: Boolean
});

module.exports = mongoose.model('ResetStatus', resetStatusSchema);