var gitUserService = require("../services/GitUserService.js");

var render = {
    homePage: function(res, locals) {
        res.render('home.ejs', {
            locals: locals
        });
    }
};

function renderHomePage(req, res) {
    var id = req.session.user_id
    if (id) {
        gitUserService.getGitUserById(id, function(err, gitUser) {
            render.homePage(res, {
                user: gitUser
            });
        });
    } else {
        res.redirect('/');
    }
}

module.exports = function(app) {
    app.get('/home', renderHomePage);
};
