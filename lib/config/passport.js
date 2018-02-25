const winston = require('winston');
const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const User = mongoose.model('User');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const tokenCache = require('../token_cache');
const jwtSecret = process.env.JWT_SECRET || 'secret';

const cookieExtractor = function(req) {
  return req && req.cookies ? req.cookies['jwtToken'] || null : null;
};

const opts = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    cookieExtractor
  ]),
  expiresIn: process.env.JWT_EXPIRE || '7d',
  passReqToCallback: true
};

passport.use(new JwtStrategy(opts, function(req, jwt_payload, done) {
  const token = opts.jwtFromRequest(req);
  if (jwt_payload && jwt_payload._id && !jwt_payload.disabled && tokenCache.validToken(jwt_payload._id, token)) {
    if (tokenCache.upToDateToken(jwt_payload)) {
      return done(null, jwt_payload);
    } else {
      User.findById(jwt_payload._id).then((user) => {
        if (user && !user.disabled) {
          const issueTime = (new Date()).getTime();
          const newToken = jwt.sign(_.assign(user.excludeFields(['passwordHash']), {'issued': issueTime}), jwtSecret);
          req.newToken = newToken;
          tokenCache.issueToken(user._id, newToken);
          done(null, user);
        } else {
          done(null, false);
        }
      }, (err) => {
        winston.error(err);
        done(null, false);
      });
    }
  } else {
    return done(null, false);
  }
}));

module.exports = passport;
