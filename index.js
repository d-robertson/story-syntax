// Setting up and requiring Node Modules that are/will be used in this project.

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

// Including / Enabling use of items in the public folder i.e. CSS, IMG, JS
app.use(express.static(__dirname + '/public/'));

// Home route that renders the homepage.
app.get('/', function(req, res) {
  res.render('index');
});

// Profile route that renders a user's profile with all of their stories. This also checks to see if the user
// has anything stored in session storage. This will allow people to use the site before
// creating an account. If session storage is being, it will post a story that is saved
// in sesssion to the DB. Profile can only be accessed if the user is loggedIn.
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

// This post route creates a story in the database from user input and redirects user
// to their profile to see confirmation of the story creation. If a user is not already
// logged in, then it will store the user's input in session storage, and then redirect
// the user to login. The if statement checks to see if user has the proper permissions
// to view a specific story i.e. it will only display user stories associated with
// the user's id.
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

// This get route renders a page that allows the user to edit a story they created.
// The if statement checks to ensure the user has the proper permissions to edit
// a user story. There is also a built-in 404 easter egg to encapsulate how I felt while
// creating this project. This will be updated before employer presentations.
app.get('/profile/edit/:id', function(req, res) {
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

// This post route will update a user story. This also has the 404 easter egg.
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

// This post route delete a user story associated with a user's account. User's
// must be logged in to be able to delete or edit a user story. 404 easter egg.
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
