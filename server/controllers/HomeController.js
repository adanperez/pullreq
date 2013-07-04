var gitUserService = require("../services/GitUserService.js");

var render = {
    homePage: function(res, locals) {
        res.render('home.ejs', {
            locals: locals
        });
    }
}

function getAndClearMessage(req) {
    var message = req.session.message;
    delete req.session.message;
    return message;
}

function renderHomePage(req, res) {
    var id = req.session.user_id
    if (id) {
        gitUserService.getGitUserById(id, function(err, gitUser) {
            render.homePage(res, {
                user: gitUser,
                message: null
            });
        });
    } else {
        res.redirect('/');
    }
}

module.exports = function(app) {
    app.get('/home', renderHomePage);
};
