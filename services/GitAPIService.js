var request =   require('request');

function makeGitRequest(token, path, params, callback) {
    var req = {
        method: 'GET',
        url: 'https://api.github.com' + path,
        headers: {
            'Host': 'api.github.com',
            'Authorization': 'token ' + token,
            'user-agent': 'Mozilla/5.0'
        },
        qs: params ? params : {},
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
    makeGitRequest(token, '/user/orgs', {per_page:100}, callback);
}

exports.getUserRepos = function(token, callback) {
    makeGitRequest(token, '/user/repos', {per_page:100}, callback);
}

exports.getOrgRepos = function(token, org, callback) {
    makeGitRequest(token, '/orgs/' + org + '/repos', {per_page:100}, callback);
}

exports.getOrgMembers = function(token, org, callback) {
    makeGitRequest(token, '/orgs/' + org + '/members', {per_page:100}, callback);
}

exports.getCommitsByUser = function(token, owner, repo, user, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/commits', {author:user, per_page:100}, callback);
}

exports.getCommitBySha = function(token, owner, repo, sha, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/commits/' + sha, null, callback);
}

exports.getPullRequests = function(token, owner, repo, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls', {per_page:100}, callback);
}

exports.getPullRequestCommits = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/commits', {per_page:100}, callback);
}

exports.getPullRequestFiles = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/files', {per_page:100}, callback);
}

exports.getPullRequestComments = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/comments', {per_page:100}, callback);
}

exports.getIssueComments = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/issues/' + pullNumber + '/comments', {per_page:100}, callback);
}