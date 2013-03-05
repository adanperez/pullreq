var request =   require('request');
var qs =        require('querystring');
var request =   require('request');
var async =     require('async');
var _ =         require('underscore');
var gitAPIService = require("../services/GitAPIService.js");
var repoService =    require("../services/RepoService.js");


function requireAuthentication(req, res, next) {
    if (req.session.user_token) {
        next();
    } else {
        res.send(403, {error:'Not Authenticated'});
    }
}

function jsonResponse(err, json, response) {
    response.contentType('json');
    if (err) {
        response.send(500, {error:err.message});
    } else {
        response.send(200, json);
    }
}

function getPullRequestInfo(req, res) {
    var userToken = req.session.user_token;
    var owner = req.params.owner;
    var repo = req.params.repo;
    var pullNumber = req.params.pullNumber;
    var info = {
        'commits': function(callback) {
            gitAPIService.getPullRequestCommits(userToken, owner, repo, pullNumber, callback);
        },
        'files': function(callback) {
            gitAPIService.getPullRequestFiles(userToken, owner, repo, pullNumber, callback);
        },
        'codeComments': function(callback) {
            gitAPIService.getPullRequestComments(userToken, owner, repo, pullNumber, callback);
        },
        'issueComments': function(callback) {
            gitAPIService.getIssueComments(userToken, owner, repo, pullNumber, callback);
        }
    }
    async.parallel(info, function(err, json) {
        jsonResponse(err, json, res);
    });
};


function getUserPullRequests(req, res) {
    var userToken = req.session.user_token;
    var userId = req.session.user_id;
    var pulls = {}
    repoService.getReposForUser(userId, function(err, repos) {
        _.each(repos, function(repo) {
            pulls[repo.owner + '/' + repo.repo] = function(callback) {
                gitAPIService.getPullRequests(userToken, repo.owner, repo.repo, callback);
            }
        }, this);
        async.parallel(pulls, function(err, json) {
            jsonResponse(err, json, res);
        });
    });
};

function getRepoOptions(req, res) {
    gitAPIService.getUserOrgs(req.session.user_token, function(err, json) {
        var options = [];
        _.each(json, function(org) {
            options.push(function(callback) {
                gitAPIService.getOrgRepos(req.session.user_token, org.login, function(err, json) {
                    org.repos = _.sortBy(json, function(repo){ return repo.name.toLowerCase(); });
                    callback(err, org);
                });
            });
        }, this);
        async.parallel(options, function(err, json) {
            jsonResponse(err, json, res);
        });
    });
};

function getUserOrgs(req, res) {
    gitAPIService.getUserOrgs(req.session.user_token, function(err, json) {
        jsonResponse(err, json, res);
    });
}

function getOrgRepos(req, res) {
    gitAPIService.getOrgRepos(token, req.params.org, function(err, json) {
        jsonResponse(err, json, req.session.user_token);
    });
}


module.exports = function(app) {
    var path = '/api';
    app.all(path + '/*', requireAuthentication);
    app.get(path + '/pullRequests', getUserPullRequests);
    app.get(path + '/pullRequestInfo/:owner/:repo/:pullNumber', getPullRequestInfo);
    app.get(path + '/userOrgs', getUserOrgs);
    app.get(path + '/repoOptions', getRepoOptions);
    app.get(path + '/orgRepos/:org', getOrgRepos);
};

