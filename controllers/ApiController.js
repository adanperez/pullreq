var request =   require('request');
var qs =        require('querystring');
var request =   require('request');
var async =     require('async');
var _ =         require('underscore');
var logger =    require('log4js').getLogger();
var gitAPIService = require("../services/GitAPIService.js");
var gitUserService = require("../services/GitUserService.js");
var repoService =    require("../services/RepoService.js");
var warningPathService =    require("../services/WarningPathService.js");


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
        logger.warn(err);
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
    var pulls = [];
    repoService.getReposForUser(userId, function(err, repos) {
        if (err) {
            jsonResponse(err, null, res);
            return;
        }
        _.each(repos, function(repo) {
            pulls.push(function(callback) {
                gitAPIService.getPullRequests(userToken, repo.owner, repo.repo, callback);
            })
        }, this);
        async.parallel(pulls, function(err, json) {
            var resp = [];
            _.each(json, function(pull) {
                if (pull && pull.length) {
                    resp = resp.concat(pull);
                }
            });
            jsonResponse(err, resp, res);
        });
    });
};

function getRepoOptions(req, res) {
    gitAPIService.getUserOrgs(req.session.user_token, function(err, json) {
        if (err) {
            jsonResponse(err, null, res);
            return;
        }
        var options = [];
        _.each(json, function(org) {
            options.push(function(callback) {
                gitAPIService.getOrgRepos(req.session.user_token, org.login, function(err, json) {
                    org.repos = _.sortBy(json, function(repo){ return repo.name.toLowerCase(); });
                    callback(err, org);
                });
            });
        }, this);
        options.push(function(callback) {
            gitAPIService.getUserRepos(req.session.user_token, function(err, json) {
                if (err) {
                    callback(err, json);
                    return;
                }
                gitUserService.getGitUserById(req.session.user_id, function(err, user) {
                    var option = {
                        login: user.login,
                        repos: _.sortBy(json, function(repo){ return repo.name.toLowerCase(); })
                    };
                    callback(err, option);
                });
            });
        });
        async.parallel(options, function(err, json) {
            jsonResponse(err, json, res);
        });
    });
};

function getWarningPaths(req, res) {
    var userId = req.session.user_id;
    warningPathService.getWarningPathsForUser(userId, function(err, paths) {
        jsonResponse(err, paths, res);
    });
}

function saveWarningPaths(req, res) {
    if (!req.body) {
        jsonResponse({error:'No body was found.'}, null, res);
        return;
    }
    var paths = [].concat(req.body);
    var options = [];
    _.each(paths, function(warnPath) {
        if (!warnPath || !warnPath.path) {
            return;
        }
        var path = warnPath.path.replace(/^\s+|\s+$/g, '');
        if (!path) {
            return;
        }
        options.push(function(callback) {
            warningPathService.saveWarningPathForUser(req.session.user_id, path, function(err, path) {
                callback(err, path);
            });
        });
    }, this);
    warningPathService.removeWarningPathsForUser(req.session.user_id, function(err) {
        async.series(options, function(err, paths) {
            jsonResponse(err, paths, res);
        });
    });
}

function saveUserRepos(req, res) {
    if (!req.body) {
        jsonResponse({error:'No body was found.'}, null, res);
        return;
    }
    var repos = [].concat(req.body);
    var options = [];
    _.each(repos, function(userRepo) {
        if (!userRepo || !userRepo.owner || !userRepo.repo) {
            return;
        }
        options.push(function(callback) {
            repoService.saveRepoForUser(req.session.user_id, userRepo.owner.toLowerCase(), userRepo.repo.toLowerCase(), function(err, repo) {
                callback(err, repo);
            });
        });
    }, this);
    repoService.removeReposForUser(req.session.user_id, function(err) {
        async.series(options, function(err, repos) {
            jsonResponse(err, repos, res);
        });
    });
}

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

function getUserRepos(req, res) {
    var userId = req.session.user_id;
    repoService.getReposForUser(userId, function(err, repos) {
        jsonResponse(err, repos, res);
    });
}


module.exports = function(app) {
    var path = '/api';
    app.all(path + '/*', requireAuthentication);
    app.get(path + '/pullRequests', getUserPullRequests);
    app.get(path + '/pullRequests/:owner/:repo/:pullNumber/info', getPullRequestInfo);
    app.get(path + '/userOrgs', getUserOrgs);
    app.get(path + '/repoOptions', getRepoOptions);
    app.get(path + '/userRepos', getUserRepos);
    app.post(path + '/userRepos', saveUserRepos);
    app.get(path + '/warningPaths', getWarningPaths);
    app.post(path + '/warningPaths', saveWarningPaths);
    app.get(path + '/orgRepos/:org', getOrgRepos);
};

