const passport = require('passport');
const passportJWT = require('passport-jwt').ExtractJwt;
const jwtSecret = process.evn.JWT_SECRET || 'none';

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
}, function (payload, done) {
  return done(null, payload);
}));

module.exports = passport;
