var express = require('express');
var ejsLayouts = require('express-ejs-layouts');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('./config/passportConfig')
var flash = require('connect-flash');
var isLoggedIn = require('./middleware/isLoggedIn');
var db = require('./models')
var app = express();

app.set('view engine', 'ejs');

app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(ejsLayouts);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  res.locals.alerts = req.flash();
  res.locals.currentUser = req.user;
  next();
});

app.use(express.static(__dirname + '/public/'));

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/profile', isLoggedIn, function(req, res) {
  res.render('profile');
});

app.use('/auth', require('./controllers/auth'));

app.post('/', function(req, res) {
  console.log('*******************', req.body.title);
  db.story.Create({
    title: req.body.title,
    given: req.body.given,
    when: req.body.when,
    and: req.body.and,
    then: req.body.then
  }).done(function(story) {
  console.log('&&&&&&&&&&&&&&&&&&&&&&&', story);
  });
});

var server = app.listen(process.env.PORT || 3000);

module.exports = server;
