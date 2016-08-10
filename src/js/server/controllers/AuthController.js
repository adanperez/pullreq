var request =           require('request');
var qs =                require('querystring');
var gitUserService =    require("../services/GitUserService.js");
var repoService =       require("../services/RepoService.js");
var logger =            require('log4js').getLogger();
var githubClientID = process.env.GITHUB_CLIENT_ID;
var githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
var githubBaseUrl = process.env.GITHUB_BASE_URL || "https://github.com";
var githubApiHost = process.env.GITHUB_API_HOST || "api.github.com";

function openAuthToGitHub(req, res) {
    var url = githubBaseUrl + '/login/oauth/authorize?' + qs.stringify({
        client_id: githubClientID,
        scope:'user,repo,notifications,gist'
    });
    res.redirect(url);
}

function register(req, res) {
    var code = req.query.code;
    if (!code) {
        res.redirect('/');
        return;
    }

    var gitReq = {
        method: 'POST',
        url: githubBaseUrl + '/login/oauth/access_token?' + qs.stringify({
          client_id: githubClientID,
          client_secret: githubClientSecret,
          code: code
        }),
        headers: {},
        json: true,
        encoding: 'utf8',
        strictSSL: false
    };

    request(gitReq, function (error, response, body) {
        if (error) {
            res.contentType('json');
            res.send(error);
        } else {
            var gitToken = body.access_token;
            gitReq = {
                method: 'GET',
                url: "https://" + githubApiHost + '/user?' + qs.stringify({
                  access_token: gitToken
                }),
                json: true,
                encoding: 'utf8',
                strictSSL: false
            };
            request(gitReq, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    gitUserService.addOrFindGitUser(gitToken, body, function(error, gitUser) {
                        if (error) {
                            logger.warn(error);
                            res.contentType('json');
                            res.send(error);
                            return;
                        }
                        req.session.user_id = gitUser.id;
                        req.session.user_token = gitToken;
                        logger.info(gitUser.name + ' (' + gitUser.id + ') logged in.');
                        repoService.getReposForUser(gitUser.id, function(error, repos) {
                           if (error) {
                               logger.warn(error);
                               res.contentType('json');
                               res.send(error);
                           } else {
                               if (repos.length > 0) {
                                   res.redirect('/home/');
                               } else {
                                   res.redirect('/options/');
                               }
                           }
                        });
                    });
                } else {
                    logger.warn(error + ' - Status Code: ' + response.statusCode);
                    res.contentType('json');
                    res.send(error);
                }
            });
        }
    });
}

function logout(req, res) {
    req.session.destroy();
    res.redirect('/');
}

module.exports = function(app) {
    var path = '/auth';
    app.get(path + '/login', openAuthToGitHub);
    app.get(path + '/register', register);
    app.get(path + '/logout', logout);
};