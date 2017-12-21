<<<<<<< HEAD
const mongoose = require('mongoose');
const passport = require('passport');
const passportJWT = require('passport-jwt').ExtractJwt;
const jwtSecret = process.evn.JWT_SECRET || 'none';
const User = mongoose.model('User');
=======
const passport = require('passport');
const passportJWT = require('passport-jwt').ExtractJwt;
const jwtSecret = process.evn.JWT_SECRET || 'none';
>>>>>>> d83f65c5ca4f9243c03277a3e113444501e89be9

const cookieExtractor = function (req) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['jwtToken'];
  }
  return token;
};

passport.use(new passportJWT.Strategy({
  secretOrKey: jwtSecret,
  jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([
    passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    cookieExtractor
  ])
<<<<<<< HEAD
}, function(jwt_payload, done) {
    User.findOne({id: jwt_payload.sub}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
            // or you could create a new account
        }
    });
  }));

=======
}, function (payload, done) {
  return done(null, payload);
}));
>>>>>>> d83f65c5ca4f9243c03277a3e113444501e89be9

module.exports = passport;
