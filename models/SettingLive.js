var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var settingLiveSchema = Schema({
    name: String,
    label: String,
    inputType: String,
    value: String,
    description: String,
    sortOrder: Number
});

var metatags = ['keywords', 'authors', 'language', 'description'];

settingLiveSchema.methods.isMetaTag = function() {
    return this.value.length > 0 && metatags.indexOf(this.name) !== -1;
};

module.exports = mongoose.model('SettingLive', settingLiveSchema);