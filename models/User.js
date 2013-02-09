var crypto = require('crypto');
var validators = require("../utils/ValidationUtils.js");

exports.loadModel = function(mongoose, db) {

    var Schema = mongoose.Schema;

    var User = new Schema({
        email: {
            type: String,
            validate: [
                { validator: validators.validateEmail, msg: 'invalid email' },
                { validator: validators.exists, msg: 'an email is required' },
                { validator: isEmailUnique, msg: 'email must be unique' }
            ],
            index: { unique: true },
            required: true
        },
        hashed_password: { type: String, required: true },
        name: {
            first:  { type: String, required: true },
            last:   { type: String, required: true }
        },
        dateUpdated: { type: Date, default: Date.now, required: true },
        dateCreated: { type: Date, default: Date.now, required: true },
        dateDeleted: { type: Date, default: null, required: false },
        salt: { type: String, required: true }
    },
    { autoIndex: false });

    function isEmailUnique(email, respondCallback) {
        db.model('User').findOne({email: email}, function(err, user) {
            respondCallback(!(err || user));
        });
    }

    User.virtual('password')
        .set(function(password) {
            this._password = password;
            this.salt = this.makeSalt();
            this.hashed_password = this.encryptPassword(password);
        })
        .get(function() { return this._password; });

    User.virtual('name.full').get(function () {
        return this.name.first + ' ' + this.name.last;
    });

    User.method('authenticate', function(password) {
        return this.encryptPassword(password) === this.hashed_password;
    });

    User.method('makeSalt', function() {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    });

    User.method('encryptPassword', function(password) {
        return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    });

    User.pre('save', function(next) {
        if (!validators.exists(this.password)) {
            next(new Error('Invalid password'));
        } else {
            this.dateUpdated = Date.now
            next();
        }
    });

    mongoose.model('User', User);
};