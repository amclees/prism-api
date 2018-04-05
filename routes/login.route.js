const _ = require('lodash');
const jwt = require('jsonwebtoken');
const winston = require('winston');

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = mongoose.model('User');
const Group = mongoose.model('Group');

const tokenCache = require('../lib/token_cache');

const jwtSecret = process.env.JWT_SECRET || 'secret';

router.post('/login', function(req, res, next) {
  if (!req.body.username || !req.body.password) {
    res.send({success: false, msg: 'Missing username and/or password'});
    return;
  }

  User.findOne({username: req.body.username}).then((user) => {
    if (user === null || user.disabled) {
      res.sendStatus(400);
      return;
    }
    user.comparePassword(req.body.password).then((same) => {
      if (same) {
        Group.find({members: user._id}).then(function(groupsWithUser) {
          const issueTime = (new Date()).getTime();
          const token = jwt.sign(_.assign(user.excludeFields(['passwordHash']), {'issued': issueTime}), jwtSecret);
          tokenCache.issueToken(user._id, token, issueTime);
          res.json({
            'user': user.excludeFieldsWithConfig(),
            'groups': _.map(groupsWithUser, (group) => {
              return {
                'name': group.name,
                '_id': group._id
              };
            }),
            'token': token
          });
          winston.info(`${user.username} logged in successfully.`);
        }, function(err) {
          next(err);
        });
      } else {
        res.sendStatus(400);
      }
    }, (err) => {
      next(err);
    });
  }, (err) => {
    next(err);
  });
});
module.exports = router;
