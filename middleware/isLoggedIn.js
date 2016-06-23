module.exports = function(req, res, next) {
  if (req.user) {
    next();
  } else {
    req.flash('error', 'Please login to view your user stories.');
    res.redirect('/auth/login');
  }
};
