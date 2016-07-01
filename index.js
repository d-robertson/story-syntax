var express = require('express');
var ejsLayouts = require('express-ejs-layouts');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('./config/passportConfig');
var flash = require('connect-flash');
var isLoggedIn = require('./middleware/isLoggedIn');
var db = require('./models');
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

// add check if local storage has stuff in it i.e. localstorage boolean flag. Then do a find all items in localstorage and create story same as db.story post route then change req.body to localStorage.variable, then set local to false.
app.get('/profile', isLoggedIn, function(req, res) {
  if (req.session.isUsed) {
    db.story.create({
      title: req.session.tempTitle,
      given: req.session.tempGiven,
      when: req.session.tempWhen,
      and: req.session.tempAnd,
      then: req.session.tempThen,
      userId: req.user.id
    }).then(function() {
      db.story.findAll({
        where: { userId: req.user.id }
      })
      .then(function(stories) {
        console.log(stories);
        res.render('profile.ejs', { story: stories });
      });
    });
    console.log(req.session.tempTitle);
    req.session.isUsed = false;
  } else {
    db.story.findAll({
      where: { userId: req.user.id }
    })
      .then(function(stories) {
        console.log(stories);
        res.render('profile.ejs', { story: stories });
      });
  }
});

app.use('/auth', require('./controllers/auth'));

// creates a story in the database from user input unless the session storage variable is set to true.
// If session variable .isUsed is set to false it takes data
app.post('/profile', function(req, res) {
  if (req.user) {
    db.story.create({
      title: req.body.title,
      given: req.body.given,
      when: req.body.when,
      and: req.body.and,
      then: req.body.then,
      userId: req.user.id
    }).done(function(story) {
      console.log(story);
      res.redirect('/profile');
    });
  } else {
    req.flash('error', 'Please login to view your user stories.');

    req.session.tempTitle = req.body.title;
    req.session.tempGiven = req.body.given;
    req.session.tempWhen = req.body.when;
    req.session.tempAnd = req.body.and;
    req.session.tempThen = req.body.then;
    req.session.isUsed = true;
    console.log(req.session.tempTitle);
    res.redirect('/auth/login');
  }
});

app.get('/profile/edit/:id', function(req, res) {
// GET /projects/:id - display a specific project
  db.story.find({
    where: { id: req.params.id }
  })
  .then(function(story) {
    if (req.user.id !== story.userId) throw Error();
    res.render('edit.ejs', { story: story });
  })
  .catch(function(error) {
    res.status(400).render('404.ejs');
  });
});

app.post('/profile/edit/:id', function(req, res) {
  db.story.update({
    title: req.body.title,
    given: req.body.given,
    when: req.body.when,
    and: req.body.and,
    then: req.body.then
  },
    {
      where: { id: req.params.id }
    }).then(function (result) {
      res.redirect('/profile');
    }, function(rejectPromiseError) {
      res.status(400).render('404.ejs');
    });
});

app.post('/profile/delete/:id', function(req, res) {
  db.story.destroy({
    where: { id: req.params.id }
  }).then(function (result) {
    res.redirect('/profile');
  }, function(rejectPromiseError) {
    res.status(400).render('404.ejs');
  });
});


var server = app.listen(process.env.PORT || 3000);

module.exports = server;
