const _ = require('lodash');
const winston = require('winston');

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = mongoose.model('User');

const access = require('../lib/access');
const tokenCache = require('../lib/token_cache');

router.route('/user/:user_id')
    .get(function(req, res, next) {
      User.findById(req.params.user_id).then((user) => {
        if (user === null) {
          next();
          return;
        }
        res.json(user.excludeFields());
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      if (req.user._id != mongoose.Types.ObjectId(req.params.user_id)) {
        res.sendStatus(403);
        return;
      }
      if (req.body.password) {
        User.findById(req.params.user_id).then(function(user) {
          user.setPassword(req.body.password).then(function() {
            const update = _.pick(req.body, ['username', 'email', 'name', 'config']);
            for (let key of _.keys(update)) {
              user[key] = update[key];
            }
            user.save().then(function() {
              tokenCache.modifyUser(req.params.user_id);
              if (req.user._id.equals(mongoose.Types.ObjectId(req.params.user_id))) {
                res.json(user.excludeFieldsWithConfig());
              } else {
                res.json(user.excludeFields());
              }
            }, next);
          }, next);
        }, next);
      } else {
        // Since only admins will be able to patch other users after access control, checking for disabled is not necessary
        const update = _.pick(req.body, ['username', 'email', 'name', 'config']);

        User.findByIdAndUpdate(req.params.user_id, {$set: update}, {new: true, runValidators: true}).then(function(updatedUser) {
          if (updatedUser === null) {
            next();
            return;
          }
          tokenCache.modifyUser(req.params.user_id);
          res.json(updatedUser.excludeFieldsWithConfig());
          winston.info(`Updated user ${updatedUser.username} (id: ${updatedUser._id})`);
        }, next);
      }
    })
    .delete(access.allowGroups(['Administrators']), function(req, res, next) {
      User.findByIdAndUpdate(req.params.user_id, {$set: {disabled: true}}, {new: true, runValidators: true}).then(function(disabledUser) {
        if (disabledUser) {
          res.sendStatus(204);
          tokenCache.modifyUser(req.params.user_id);
          winston.info(`Disabled user ${disabledUser.username} (id: ${disabledUser._id})`);
        } else {
          res.sendStatus(404);
        }
      }, function(err) {
        next(err);
      });
    });

router.post('/user', access.allowGroups(['Administrators']), function(req, res, next) {
  const newUser = _.pick(req.body, ['username', 'email', 'name', 'internal']);
  User.create(newUser).then(function(createdUser) {
    createdUser.setPassword(req.body.password).then(function() {
      createdUser.save().then(function() {
        winston.info(`User ${createdUser.username} (id: ${createdUser._id}) created.`);
        res.json(createdUser.excludeFields());
      }, next);
    }, next);
  }, next);
});

router.get('/users', function(req, res, next) {
  User.find().then((users) => {
    res.json(_.map(_.reject(users, 'disabled'), function(user) {
      return user.excludeFields();
    }));
  }, function(err) {
    next(err);
  });
});

module.exports = router;
