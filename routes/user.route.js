const mongoose = require('mongoose');
const express = require('express');
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'none';
const winston = require('winston');

router.post('/signin', function (req, res, next) {

  if (!req.body.username || !req.body.password) {
    res.send({success: false, msg: 'Missing username and/or password'});
    return;
  }

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
module.exports = router;
