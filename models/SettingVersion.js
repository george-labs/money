var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var settingVersionSchema = Schema({
    value: String,
    refId: { type: Schema.Types.ObjectId, ref: 'Setting' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SettingVersion', settingVersionSchema);