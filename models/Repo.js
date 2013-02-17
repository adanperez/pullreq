var validators = require("../utils/ValidationUtils.js");
var mongoose =  require('mongoose');
var Schema = mongoose.Schema;

var repo = new Schema({
        owner: {
            type: String,
            validate: [
                { validator: validators.exists, msg: 'an owner is required' }
            ],
            index: { unique: true },
            required: true
        },
        repo: {
            type: String,
            validate: [
                { validator: validators.exists, msg: 'a repo is required' }
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

repo.pre('save', function(next) {
    next();
});

mongoose.model('Repo', repo);