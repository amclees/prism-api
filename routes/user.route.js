<<<<<<< HEAD
const mongoose = require('mongoose');
const express = require('express');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'none';
const winston = require('winston');

router.post('/signin', function (req, res, next) {
=======
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
>>>>>>> d83f65c5ca4f9243c03277a3e113444501e89be9

  if (!req.body.username || !req.body.password) {
    res.send({success: false, msg: 'Missing username and/or password'});
    return;
  }

<<<<<<< HEAD
  User.findOne({username:req.body.username}).then((user) => {
    winston.info('User value', user);
    user.comparePassword(req.body.password).then((same) => {
       if (same) {
         res.json({token: jwt.sign(user,jwtSecret)});
         winston.info('${user.username} logged in successfully.');
       }
       else {
         res.sendStatus(400);
       }
   },
     (err) => {
         next(err);
   });
 },
  (err) => {
    next(err);
  }
);
});
=======
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

>>>>>>> d83f65c5ca4f9243c03277a3e113444501e89be9
module.exports = router;
