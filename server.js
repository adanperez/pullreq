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
var fs =        require('fs');
var logger =    require('log4js').getLogger();
var app = express();
var memStore = express.session.MemoryStore
var isProduction = process.env.NODE_ENV == 'production';

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
        proxy: isProduction,
        cookie: {
            maxAge: null,
            path: '/',
            httpOnly: true,
            secure: isProduction
        },
        store : memStore({ reapInterval: 60000*10 })
    }));

    app.use(express.favicon());
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));

    app.use(app.router);
    app.set('port', process.env.PORT);
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
    logger.warn('Ohs nos');
    res.render(err);
}

/**
 * Create the DB connection
 */
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/pullreq';
mongoose.connect(mongoUri);

/**
 * Load the servers models into Mongoose
 */
var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function (file) {
    require(models_path + '/' + file);
});

/**
 * If prod, force https
 */
if (isProduction) {
    app.all('*',function(req, res, next){
        if(req.headers['x-forwarded-proto'] != 'https') {
            res.redirect('https://' + req.headers.host + req.url);
        } else {
            next();
        }
    })
}

/**
 * Controllers for sections of the website
 */
require("./controllers/IndexController.js")(app);
require("./controllers/AuthController.js")(app);
require("./controllers/ApiController.js")(app);
require("./controllers/HomeController.js")(app);
require("./controllers/OptionsController.js")(app);

http.createServer(app).listen(app.get('port'), function() {
    logger.info("Express server listening on port " + app.get('port'));
    //logger.info(app.routes);
});