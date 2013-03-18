var mongoose = require('mongoose'),
    WarningPath = mongoose.model('WarningPath');

exports.removeWarningPathsForUser = function(userId, callback) {
    WarningPath.remove({ userId: userId }, function (err) {
        callback(err);
    });
}

exports.saveWarningPathForUser = function(userId, path, callback) {
    var warningPath = new WarningPath({
        path: path,
        userId: userId
    });

    warningPath.save(function (err, path) {
        if (err) {
            callback(new Error('Error: ' + err), null);
        } else {
            callback(null, path);
        }
    });
}

exports.getWarningPathsForUser = function(userId, callback) {
    WarningPath.find({ userId: userId }, function(err, paths) {
        if (err) {
            callback(new Error('Problem fetching warning paths'), null);
            return;
        }
        callback(null, paths);
    });
};