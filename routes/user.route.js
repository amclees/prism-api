const _ = require('lodash');
const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = mongoose.model('User');

router.route('/user/:user_id')
    .get(function(req, res, next) {
      User.findById(req.params.user_id).then((user) => {
        if (user === null || user.disabled) {
          next();
          return;
        }
        if (req.user._id.equals(mongoose.Types.ObjectId(req.params.user_id))) {
          res.json(user.excludeFieldsWithConfig());
        } else {
          res.json(user.excludeFields());
        }
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      // Since only admins will be able to patch other users after access control, checking for disabled is not necessary
      const update = _.pick(req.body, ['username', 'email', 'name', 'config']);
      User.findByIdAndUpdate(req.params.user_id, {$set: update}, {new: true, runValidators: true}).then(function(updatedUser) {
        res.json(updatedUser.excludeFieldsWithConfig());
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      User.findByIdAndUpdate(req.params.user_id, {$set: {disabled: true}}, {new: true, runValidators: true}).then(function(disabledUser) {
        if (disabledUser) {
          res.sendStatus(204);
        } else {
          res.sendStatus(404);
        }
      }, function(err) {
        next(err);
      });
    });

router.post('/user', function(req, res, next) {
  const newUser = _.pick(req.body, ['username', 'email', 'name', 'internal']);
  User.create(newUser).then(function(createdUser) {
    createdUser.setPassword(req.body.password).then(function() {
      createdUser.save().then(function() {
        winston.info(`User ${createdUser.username} created.`);
        res.json(createdUser.excludeFields());
      }, function(err) {
        next(err);
      });
    }, function(err) {
      next(err);
    });
  }, function(err) {
    next(err);
  });
});

router.use('/users', function(req, res, next) {
  User.find().then((users) => {
    // Once groups are attached to req, should allow admins to see disabled users
    res.json(_.map(_.reject(users, 'disabled'), function(user) {
      return user.excludeFields();
    }));
  }, function(err) {
    next(err);
  });
});

module.exports = router;
