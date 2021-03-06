var express = require('express');
var router = express.Router();
var db = require('../models');
var passport = require('../config/passportConfig');

router.get('/signup', function(req, res) {
  res.render('auth/signup');
});

router.post('/signup', function(req, res) {
  db.user.findOrCreate({
    where: { email: req.body.email },
    defaults: {
      name: req.body.name,
      password: req.body.password
    }
  }).spread(function(user, created) {
    if (created) {
      passport.authenticate('local', {
        successRedirect: '/',
        successFlash: 'User created. You are logged in.'
      })(req, res);
    } else {
      console.log('user with that email already exists');
      res.redirect('/auth/signup');
    }
  }).catch(function(error) {
    console.log('error occured', error.message);
    res.redirect('/auth/signup');
  });
});


router.get('/login', function(req, res) {
  res.render('auth/login');
});

router.get('/facebook', passport.authenticate('facebook', {
  scope: ['public_profile', 'email']
}));

router.get('/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/profile',
  failureRedirect: '/auth/login',
  failureFlash: 'An error occurred, please try later',
  successFlash: 'You have logged in with Facebook'

}));

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/auth/login'
}));

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
