var mongoose = require('mongoose'),
    GitUserToken = mongoose.model('GitUserToken'),
    GitUser = mongoose.model('GitUser');

function addGitToken(token, userId, callback) {
    var gitUserToken = new GitUserToken({
        token: token,
        userId: userId
    });
    gitUserToken.save(function (err, gitUserToken) {
        if (err) {
            callback(new Error('Error: ' + err), null);
        } else {
            callback(null, gitUserToken);
        }
    });
};

exports.addOrFindGitUser = function(gitToken, gitUserJson, callback) {
    GitUser.findOne({ id: gitUserJson.id }, function(err, gitUser) {
        if (err) {
            callback(new Error('GitUser not found.'), null);
            return;
        }

        if (gitUser) {
            addGitToken(gitToken, gitUser.id, function(err, token) {
                callback(null, gitUser);
            });
        } else {
            // create the user and return it
            var user = new GitUser({
                login: gitUserJson.login,
                id: gitUserJson.id,
                name: gitUserJson.name,
                url: gitUserJson.url
            });

            user.save(function (err, gitUser) {
                if (err) {
                    callback(new Error('Error: ' + err), null);
                } else {
                    addGitToken(gitToken, gitUser.id, function(err, token) {
                        callback(null, gitUser);
                    });
                }
            });
        }
    });
};

exports.getGitUserById = function(gitId, callback) {
    GitUser.findById(gitId, callback);
};