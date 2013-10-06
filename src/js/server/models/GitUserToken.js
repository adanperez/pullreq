var validators = require("../utils/ValidationUtils.js");
var mongoose =  require('mongoose');
var Schema = mongoose.Schema;

function isTokenUnique(token, respondCallback) {
    mongoose.model('GitUserToken').findOne({token: token}, function(err, user) {
        respondCallback(!(err || user));
    });
}

var gitUserToken = new Schema({
        token: {
            type: String,
            validate: [
                { validator: validators.exists, msg: 'a token is required' },
                { validator: isTokenUnique, msg: 'token is not unique' }
            ],
            index: { unique: true },
            required: true
        },
        userId: {
            type: Number,
            index: { unique: true },
            required: true
        },
        dateCreated: { type: Date, default: Date.now, required: true },
        dateDeleted: { type: Date, default: null, required: false }
    },
    { autoIndex: false });

gitUserToken.statics.findByUserId = function (id, callback) {
    this.findOne({ userId: id }, callback);
};

gitUserToken.pre('save', function(next) {
    next();
});

mongoose.model('GitUserToken', gitUserToken);