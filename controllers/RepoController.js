var gitUserService = require("../services/GitUserService.js");

var render = {
    mainPage: function(res, locals) {
        res.render('repos.ejs', {
            locals: locals
        });
    }
}

function getAndClearMessage(req) {
    var message = req.session.message;
    delete req.session.message;
    return message;
}

function renderRepoPage(req, res) {
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
    app.get('/repos', renderRepoPage);
};
