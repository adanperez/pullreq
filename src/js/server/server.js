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
var _ =         require('lodash');
var fs =        require('fs');
var logger =    require('log4js').getLogger();
var MongoStore = require('connect-mongo')(express);

var app = express();

var memStore = express.session.MemoryStore
var isProduction = process.env.NODE_ENV == 'production';

https.globalAgent.maxSockets = 500;
http.globalAgent.maxSockets = 500;

/**
 * Create the DB connection
 */
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/pullreq';
mongoose.connect(mongoUri);

/**
 * Configure app
 */
app.configure('all', function() {
    app.use(express.favicon(__dirname + '/../../../public/img/favicon.ico'));
    app.engine('ejs', ejslocals);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('view options', {
        open: '<%',
        close: '%>'
    });

    app.use(express.static(__dirname + '/../../../public'));
    app.use(express.cookieParser());
    app.use(express.session({
        secret: process.env.SESSION_SECRET,
        key: 'sid',
        proxy: isProduction,
        cookie: {
            maxAge: 5*365*24*60*60*1000, // 5 years
            path: '/',
            httpOnly: true,
            secure: isProduction
        },
        store : new MongoStore({
            collection: 'sessions',
            mongoose_connection: mongoose.connections[0]
        })
    }));
    //app.use(express.favicon());

    app.use(express.logger());
    app.use(express.compress());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(errorHandler);
    app.use(clientErrorHandler);
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

    //todo redirect to error page
    //logger.warn(err);
    //res.status(500);
    //res.render(err);
    next(err);
}

/**
 * Load the servers models into Mongoose
 */
var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function (file) {
    require(models_path + '/' + file);
});

/**
 * Controllers for sections of the website
 */
var controllers_path = __dirname + '/controllers'
fs.readdirSync(controllers_path).forEach(function (file) {
    require(controllers_path + '/' + file)(app);
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
    });
}

/**
 * Start server
 */
http.createServer(app).listen(app.get('port'), function() {
    logger.info("Express server listening on port " + app.get('port'));
    //logger.info(app.routes);
});
