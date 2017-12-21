const mongoose = require('mongoose');
const express = require('express');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'none';
const winston = require('winston');
const _ = require('lodash');

router.post('/login', function (req, res, next) {

  if (!req.body.username || !req.body.password) {
    res.send({success: false, msg: 'Missing username and/or password'});
    return;
  }

  User.findOne({username:req.body.username}).then((user) => {
    winston.info('User value', user);
    user.comparePassword(req.body.password).then((same) => {
      winston.info('User same', same);
       if (same) {
         res.json({token: jwt.sign(_.omit(user.toObject(), ['passwordHash']), jwtSecret)});
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
module.exports = router;
