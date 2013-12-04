var mongoose = require('mongoose')
    , Schema = mongoose.Schema;
    
var appVersionSchema = new Schema({
    pages: [Schema.Types.Mixed],
    pageElements: [Schema.Types.Mixed],
    pageElementProperties: [Schema.Types.Mixed],
    brandings: [Schema.Types.Mixed],
    settings: [Schema.Types.Mixed],
    versions: [Schema.Types.Mixed],
    tag: String,
    creationDate: { type: Date, default: Date.now },
    liveVersion: { type: Boolean, default: false }
});

module.exports = mongoose.model('AppVersion', appVersionSchema);