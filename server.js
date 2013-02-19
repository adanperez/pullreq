var express =   require('express');
var http =      require('http');
var https =     require('https');
var qs =        require('querystring');
var request =   require('request');
var async =     require('async');
var ejslocals = require('ejs-locals');
var mongoose =  require('mongoose');
var connect =   require('connect');
var uuid =      require('node-uuid');
var _ =         require('underscore');
var nconf =     require('nconf');
var fs =        require('fs');
var app = express();
var memStore = express.session.MemoryStore

/**
 * Setup nconf to use (in-order):
 */
nconf.argv() // 1. Command-line arguments
     .env()  // 2. Environment variables
     .file({ file: './config.json' });  // 3. A file located at 'path/to/config.json'

app.configure('all', function() {
    app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
    app.engine('ejs', ejslocals);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('view options', {
        open: '<%',
        close: '%>'
    });

    app.use(express.static(__dirname + '/public'));
    app.use(express.cookieParser());
    app.use(express.session({
        secret: uuid.v4(),
        key: 'sid',
        maxAge: new Date(Date.now() + 60000*10),
        cookie: { maxAge: null, path: '/', httpOnly: true },
        store : memStore({ reapInterval: 60000*10 })
    }));

    console.log(uuid.v4());

    app.use(express.favicon());
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));

    app.use(app.router);
    app.set('port', 3000);
});

function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.send(500, { error: 'Something blew up!' });
    } else {
        next(err);
    }
}

function errorHandler(err, req, res, next) {
    res.status(500);
    console.log('Ohs nos');
    res.render(err);
}

/**
 * Create the DB connection
 */
mongoose.connect(nconf.get('db:server'), nconf.get('db:database'));

/**
 * Load the servers models into Mongoose
 */
var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function (file) {
    console.log('Loading: ' + models_path + '/' + file);
    require(models_path + '/' + file);
});

/**
 * Controllers for sections of the website
 */
require("./controllers/IndexController.js")(app);
require("./controllers/AuthController.js")(app);
require("./controllers/ApiController.js")(app);
require("./controllers/HomeController.js")(app);
require("./controllers/RepoController.js")(app);

http.createServer(app).listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
    console.log(app.routes);
});