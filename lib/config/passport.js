const mongoose = require('mongoose');
const passport = require('passport');
const User = mongoose.model('User');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const winston = require('winston');

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';

passport.use(new JwtStrategy(opts, function(jwt_payload, done, next) {
  winston.debug(`Find user by id:`, jwt_payload._id, 'Entire payload is', jwt_payload);
  User.findById(jwt_payload._id).then((user) => {
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  }, (err) => {
    next(err);
  });
}));

module.exports = passport;
