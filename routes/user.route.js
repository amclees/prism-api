const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwtSecret = process.env.JWT_SECRET || 'none';

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';
winston.debug('JWT:', {
  secret: jwtSecret
});

router.post('/signin', function (req, res) {

  if (!req.body.username || !req.body.password) {
    res.send({success: false, msg: 'Missing username and/or password'});
    return;
  }

  User.findOne({
    username: req.body.username
  }, function (err, user) {
    if (err) {
      throw err;
    }

    if (!user) {
      res.send({success: false, msg: 'User not found.'});
      return;
    }

    bcrypt.compare(req.body.password, user.passwordHash, function (err, success) {
      if (!success) {
        res.send({success: false, msg: 'Incorrect password'});
        return;
      } else
      res.status(200).json({
        token: jwt.sign(user, jwtSecret)
    });
    winston.info(`${user.username} logged in successfully.`);
  });
});
});

module.exports = router;
