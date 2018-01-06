const mongoose = require('mongoose');
const passport = require('passport');
const User = mongoose.model('User');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const opts = {
  secretOrKey: process.env.JWT_SECRET || 'secret',
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  expiresIn: process.env.JWT_EXPIRE || '7d'
};

passport.use(new JwtStrategy(opts, function(jwt_payload, done, next) {
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
