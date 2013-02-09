var db
var userService

function authenticate(email, pass, req, res) {
    userService.authenticate(email, pass, function(err, user) {
        if (user) {
            req.session.user_id = user.id;
            console.log('Logged in: ' + user.name.full)
            req.session.message = 'Logged in!';
        } else {
            req.session.message = err.message;
        }
        res.redirect('/');
    });
}

function loginGet(req, res) {
    var pass = req.query.password,
        email = req.query.email;
    authenticate(email, pass, req, res);
}

function loginPost(req, res) {
    var pass = req.body.password,
        email = req.body.email;
    authenticate(email, pass, req, res);
}

function logout(req, res) {
    req.session.destroy();
    res.redirect('/');
}

/**
 * The exported code
 * @param app - express application
 * @param database - mongoDB connection
 */
exports.init = function(app, database) {
    db = database
    userService = require("../services/UserService.js")(db);

    var path = '/auth';
    app.get(path + '/logout', logout);
    app.get(path + '/login', loginGet);
    app.post(path + '/login', loginPost);
};
