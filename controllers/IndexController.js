var db
var userService

var render = {
    indexPage: function(res, locals) {
        res.render('index.ejs', {
            locals: locals
        });
    }
}

function getAndClearMessage(req) {
    var message = req.session.message;
    delete req.session.message;
    return message;
}

function renderIndex(req, res) {
    console.log(req.session);
    if (req.session.user_id) {
        var UserModel = db.model('User');
        UserModel.findById(req.session.user_id, function(err, user) {
            render.indexPage(res, {
                user: user,
                message: null
            });
        });
    } else {
        render.indexPage(res, {
            user: null,
            message: getAndClearMessage(req)
        });
    }
}
/**
 * The exported code
 * @param app - express application
 * @param database - mongoDB connection
 */
exports.init = function(app, database) {
    db = database
    userService = require("../services/UserService.js")(db);
    app.get('/', renderIndex);
};
