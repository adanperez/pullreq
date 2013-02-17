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
    render.indexPage(res, {
        user: null,
        message: getAndClearMessage(req)
    });
}

module.exports = function(app) {
    app.get('/', renderIndex);
};
