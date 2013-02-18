var request =   require('request');

function makeGitRequest(token, path, callback) {
    var req = {
        method: 'GET',
        url: 'https://api.github.com' + path,
        headers: {
            'Host': 'api.github.com',
            'Authorization': 'token ' + token
        },
        json: true,
        encoding: 'utf8'
    }
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            callback(error, null);
        }
    });
}

exports.getUserOrgs = function(token, callback) {
    makeGitRequest(token, '/user/orgs', callback);
}

exports.getOrgRepos = function(token, org, callback) {
    makeGitRequest(token, '/orgs/' + org + '/repos', callback);
}

exports.getPullRequests = function(token, owner, repo, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls', callback);
}

exports.getPullRequestCommits = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/commits', callback);
}

exports.getPullRequestFiles = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/files', callback);
}

exports.getPullRequestComments = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/comments', callback);
}