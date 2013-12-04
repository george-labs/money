var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var tokenSchema = Schema({
    uid: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Token', tokenSchema);