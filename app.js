var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var jwt = require('jsonwebtoken');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const config = require('./config/index.json');
var cors = require('cors');
var multer = require('multer');
var dotenv = require('dotenv').config();
//var routes = require('./routes/index');
//var users = require('./routes/users');


var Model = require('./models');

// Call this to init the DB ... so that all future models load instantly...

Model.init();


// Load my router ... this will be used to load all routes from specified dir, ie. routeDir (or <app-root>/routes in case none given)
// We can even set the default root by setting indexController property.
var router = require('./router')({
  indexController: "index"
});

var gaikan = require('gaikan');

// Set views directory for gaikan
gaikan.options.rootDir = path.join(__dirname, 'views');
// Restricting template finding to views directory only
gaikan.options.directories = ['.'];


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// Set Gaikan as the html view engine
app.engine('html', gaikan);
// Set html as the main template engine
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

var compression = require('compression');

app.use(compression({
  threshold: 0,
  filter: shouldCompress
}));

function shouldCompress(req, res) {
  
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false
  }
  // fallback to standard filter function
  return compression.filter(req, res)
}


app.use(multer({
  dest: path.join(__dirname, "tmp/")
}).any());


app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false,
  sourceMap: true
}));

// app.use(function(req, res, next){
//   res.setHeader("Access-Control-Allow-Origin", '*');
// });

app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
//app.use('/users', users);


app.use(function(req, res, next){
  
  var token = req.body.token || req.query.token || false;
  if(!token){
    req.userinfo = {
      "isGuest": true,
      "isAdmin": false,
      "isTrainer": false,
      "name": "Guest"
    };
    next();
  }else {
    try {
      token = jwt.verify(token, config.secret);
      req.userinfo = token;
      next();
    }catch(err){
      next(err);
    }
  }
});



// Load routes...
router.loadRoutes(app);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    var status = err.status || 500;
    res.status(status);
    res.render('error', {
      message: status + " - " + err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  var status = err.status || 500;
  res.status(status);
  res.render('error', {
    message: status + " - " + err.message,
    error: {}
  });
});


module.exports = app;


