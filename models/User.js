var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var bcrypt = require('bcrypt-nodejs');

var userSchema = Schema({
    username: String,
    password: String,
    role: String
});

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.setPassword = function(password) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    this.password = hash;
};

module.exports =  mongoose.model('User', userSchema);