var validators = require("../utils/ValidationUtils.js");
var mongoose =  require('mongoose');
var Schema = mongoose.Schema;

var warningPath = new Schema({
        path: {
            type: String,
            validate: [
                { validator: validators.exists, msg: 'a path is required' }
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

warningPath.pre('save', function(next) {
    next();
});

mongoose.model('WarningPath', warningPath);