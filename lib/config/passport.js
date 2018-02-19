const mongoose = require('mongoose');
const passport = require('passport');
const User = mongoose.model('User');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const opts = {
  secretOrKey: process.env.JWT_SECRET || 'secret',
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    function(req) {
      return req && req.cookies ? req.cookies['jwtToken'] || null : null;
    }
  ]),
  expiresIn: process.env.JWT_EXPIRE || '7d'
};

passport.use(new JwtStrategy(opts, function(jwt_payload, done, next) {
  User.findById(jwt_payload._id).then((user) => {
    if (user && !user.disabled) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  }, (err) => {
    next(err);
  });
}));

module.exports = passport;
