var _ = require('lodash');
var async =     require('async');

var gitUserService = require("../services/GitUserService.js");

function requireAuthentication(req, res, next) {
    if (req.session.user_id) {
        next();
    } else {
        res.send(403, {error:'Not Authenticated'});
    }
}

var render = {
    mainPage: function(res, locals) {
        res.render('options.ejs', {
            locals: locals
        });
    }
}

function getAndClearMessage(req) {
    var message = req.session.message;
    delete req.session.message;
    return message;
}

function editRepoPage(req, res) {
    var id = req.session.user_id
    if (id) {
        gitUserService.getGitUserById(id, function(err, gitUser) {
            render.mainPage(res, {
                user: gitUser,
                message: null
            });
        });
    } else {
        render.mainPage(res, {
            user: null,
            message: getAndClearMessage(req)
        });
    }
}

module.exports = function(app) {
    var path = '/options'
    app.all(path + '/*', requireAuthentication);
    app.get(path, editRepoPage);
};
