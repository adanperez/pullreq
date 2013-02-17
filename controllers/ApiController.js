var request =   require('request');
var nconf =     require('nconf');
var qs =        require('querystring');
var request =   require('request');
var async =     require('async');
var _ =         require('underscore');
var gitAPIService = require("../services/GitAPIService.js");

var repos = nconf.get('repos');

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

function getPullRequests(req, res) {

    var pulls = {}
    for (var repo in repos) {
        if (repos.hasOwnProperty(repo)) {
            var projects = repos[repo];
            for (var i = 0; i < projects.length; i++) {
                (function() {
                    var project = projects[i];
                    pulls[project] = function(callback) {
                        gitAPIService.getPullRequests(req.session.user_token, repo, project, callback);
                    }
                })();
            }
        }
    }

    async.parallel(pulls, function(err, json) {
        jsonResponse(err, json, res);
    });
};

function getRepoOptions(req, res) {
    gitAPIService.getUserOrgs(req.session.user_token, function(err, json) {
        var options = [];
        _.each(json, function(org) {
            console.log(org);
            options.push(function(callback) {
                gitAPIService.getOrgRepos(req.session.user_token, org.login, function(err, json) {
                    org.repos = json
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
    app.get(path + '/pullRequests', getPullRequests);
    app.get(path + '/userOrgs', getUserOrgs);
    app.get(path + '/repoOptions', getRepoOptions);
    app.get(path + '/orgRepos/:org', getOrgRepos);
};

