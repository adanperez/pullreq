var mongoose = require('mongoose'),
    GitUser = mongoose.model('GitUser');

exports.addOrFindGitUser = function(gitToken, gitUserJson, callback) {
    GitUser.findOne({ id: gitUserJson.id }, function(err, gitUser) {
        if (err) {
            callback(new Error('GitUser not found.'), null);
            return;
        }

        if (gitUser) {
            callback(null, gitUser);
        } else {
            // create the user and return it
            var user = new GitUser({
                login: gitUserJson.login,
                id: gitUserJson.id,
                name: gitUserJson.name,
                url: gitUserJson.html_url
            });

            user.save(function (err, gitUser) {
                if (err) {
                    callback(new Error('Error: ' + err), null);
                } else {
                    callback(null, gitUser);
                }
            });
        }
    });
};

exports.getGitUserById = function(gitId, callback) {
    GitUser.findById(gitId, callback);
};