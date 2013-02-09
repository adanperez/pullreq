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
var nconf =     require('nconf')
var app = express();
var memStore = express.session.MemoryStore
//var db = mongoose.createConnection('localhost', 'gitpull');

/**
 * Load the servers models into Mongoose
 */
//require(__dirname + "/models/User.js").loadModel(mongoose, db);


/**
 * Setup nconf to use (in-order):
 */
nconf.argv() // 1. Command-line arguments
     .env()  // 2. Environment variables
     .file({ file: './config.json' });  // 3. A file located at 'path/to/config.json'

app.configure('all', function() {

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
        cookie: { maxAge: 60000*10, path: '/', httpOnly: true },
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

var username = nconf.get('username');
var password = nconf.get('password');
var repos = nconf.get('repos');
console.log(repos)

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

var render = {
    indexPage: function(res, locals) {
        res.render('index.ejs', {
            locals: locals
        });
    }
}

app.get('/', function(req, res) {
    render.indexPage(res, {});
});

app.get('/git/pulls', function(req, res) {

    var auth2 = {
        method: 'GET',
        url: 'https://' + username + ':' + password + '@api.github.com/repos//' + '' + '/pulls',
        json: true,
        encoding: 'utf8'
    }

    var pulls = {}
    for (var repo in repos) {
        if (repos.hasOwnProperty(repo)) {
            var projects = repos[repo];
            for (var i = 0; i < projects.length; i++) {
                (function() {
                    var project = projects[i];
                    var auth = {
                        method: 'GET',
                        url: 'https://api.github.com/repos/' + repo + '/' + project + '/pulls',
                        headers: {
                            'Host': 'api.github.com',
                            'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
                        },
                        json: true,
                        encoding: 'utf8'
                    }
                    pulls[project] = function(callback) {
                        request(auth, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                console.log(body);
                            } else {
                                console.log(error);
                            }
                            callback(error, body);
                        });
                    }
                })();
            }
        }
    }

    async.parallel(pulls, function(err, results) {
        if (err) {
            res.contentType('json');
            res.send({error:err.message});
        } else {
            res.contentType('json');
            res.send(results);
        }
    });
});


app.get('/git/users/:username', function(req, res) {
    var auth2 = {
        method: 'GET',
        url: 'https://@api.github.com/users/' + req.params.username,
        json: true,
        encoding: 'utf8'
    }
    request(auth2, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        } else {
            console.log(error);
        }
        res.contentType('json');
        res.send(body);
    });

});

/**
 * Controllers for sections of the website
 */
//require("./controllers/IndexController.js").init(app, db);
//require("./controllers/AuthController.js").init(app, db);

http.createServer(app).listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
    console.log(app.routes);
});