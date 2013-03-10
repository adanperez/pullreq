var mongoose = require('mongoose'),
    GitUser = mongoose.model('GitUser');

exports.addOrFindGitUser = function(gitToken, gitUserJson, callback) {
    GitUser.findOne({ id: gitUserJson.id }, function(err, gitUser) {
        if (err) {
            callback(new Error('GitUser not found.'), null);
            return;
        }

        if (!gitUser) {
            gitUser = new GitUser({
                id: gitUserJson.id
            });
        }
        // Update any changes
        gitUser.login = gitUserJson.login;
        gitUser.name = gitUserJson.name;
        gitUser.url = gitUserJson.html_url;

        gitUser.save(function (err, gitUser) {
            if (err) {
                callback(new Error('Error: ' + err), null);
            } else {
                callback(null, gitUser);
            }
        });
    });
};

exports.getGitUserById = function(gitId, callback) {
    GitUser.findById(gitId, callback);
};