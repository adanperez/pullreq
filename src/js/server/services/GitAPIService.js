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
    };
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body);
        } else {
            callback(error, null);
        }
    });
}

function mineGitRequest(token, path, params, list, callback) {
    var req = {
        method: 'GET',
        url: 'https://api.github.com' + path,
        headers: {
            'Host': 'api.github.com',
            'Authorization': 'token ' + token,
            'user-agent': 'Mozilla/5.0'
        },
        qs: params,
        json: true,
        encoding: 'utf8'
    };
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            list = list.concat(body);
            if (response.headers.link && response.headers.link.indexOf('rel="next"') != -1) {
                params.page++;
                mineGitRequest(token, path, params, list, callback);
            } else {
                callback(null, list);
            }
        } else {
            callback(error, null);
        }
    });
}

exports.getUserOrgs = function(token, callback) {
    makeGitRequest(token, '/user/orgs', {page:1, per_page:100}, callback);
};

exports.getUserRepos = function(token, callback) {
    makeGitRequest(token, '/user/repos', {page:1, per_page:100}, callback);
};

exports.getOrgRepos = function(token, org, callback) {
    makeGitRequest(token, '/orgs/' + org + '/repos', {page:1, per_page:100}, callback);
};

exports.getOrgMembers = function(token, org, callback) {
    makeGitRequest(token, '/orgs/' + org + '/members', {page:1, per_page:100}, callback);
};

exports.getCommitsByUser = function(token, owner, repo, user, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/commits', {author:user, page:1, per_page:100}, callback);
};

exports.getCommitBySha = function(token, owner, repo, sha, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/commits/' + sha, null, callback);
};

exports.getPullRequests = function(token, owner, repo, callback) {
    mineGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls', {page:1, per_page:100}, [], callback);
};

exports.getPullRequestCommits = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/commits', {page:1, per_page:100}, callback);
};

exports.getPullRequestFiles = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/files', {page:1, per_page:100}, callback);
};

exports.getPullRequestComments = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/pulls/' + pullNumber + '/comments', {page:1, per_page:100}, callback);
};

exports.getIssueComments = function(token, owner, repo, pullNumber, callback) {
    makeGitRequest(token, '/repos/' + owner + '/' + repo + '/issues/' + pullNumber + '/comments', {page:1, per_page:100}, callback);
};