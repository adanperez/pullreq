var validators = require("../utils/ValidationUtils.js");
var mongoose =  require('mongoose');
var Schema = mongoose.Schema;

function isloginUnique(login, respondCallback) {
    var gitUser = this;
    mongoose.model('GitUser').findOne({login: login}, function(err, user) {
        respondCallback(!(err || (user && user.id != gitUser.id)));
    });
}

var gitUser = new Schema({
        login: {
            type: String,
            validate: [
                { validator: validators.exists, msg: 'a login is required' },
                { validator: isloginUnique, msg: 'login is not unique' }
            ],
            index: { unique: true },
            required: true
        },
        id: {
            type: Number,
            index: { unique: true },
            required: true
        },
        name: { type: String, required: true, default: 'Github User' },
        url: { type: String, required: true, default: 'http://github.com' },
        dateUpdated: { type: Date, default: Date.now, required: true },
        dateCreated: { type: Date, default: Date.now, required: true },
        dateDeleted: { type: Date, default: null, required: false }
    },
    { autoIndex: false });

gitUser.statics.findByLogin = function (login, callback) {
    this.findOne({ login: login }, callback);
}

gitUser.statics.findById= function (id, callback) {
    this.findOne({ id: id }, callback);
}

gitUser.pre('save', function(next) {
    this.dateUpdated = Date.now();
    next();
});

mongoose.model('GitUser', gitUser);