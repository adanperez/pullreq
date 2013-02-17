var mongoose = require('mongoose'),
    Repo = mongoose.model('Repo');

exports.getReposForUser = function(userId, callback) {
    Repo.find({ userId: userId }, function(err, repos) {
        if (err) {
            callback(new Error('Problem fetching repos'), null);
            return;
        }
        callback(null, repos);
    });
};