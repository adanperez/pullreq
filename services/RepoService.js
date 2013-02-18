var mongoose = require('mongoose'),
    Repo = mongoose.model('Repo');

exports.removeReposForUser = function(userId, callback) {
    Repo.remove({ userId: userId }, function (err) {
        callback(err);
    });
}

exports.saveRepoForUser = function(userId, owner, repo, callback) {
    var repos= new Repo({
        owner: owner,
        repo: repo,
        userId: userId
    });

    repos.save(function (err, repos) {
        if (err) {
            callback(new Error('Error: ' + err), null);
        } else {
            callback(null, repos);
        }
    });
}

exports.getReposForUser = function(userId, callback) {
    Repo.find({ userId: userId }, function(err, repos) {
        if (err) {
            callback(new Error('Problem fetching repos'), null);
            return;
        }
        callback(null, repos);
    });
};