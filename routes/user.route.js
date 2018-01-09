const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = mongoose.model('User');

const _ = require('lodash');

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

// router.param('user_id', function(req, res, next, id) {
//   req.id = id;
//   try {
//     User.findById(id).then((user) => {
//       req.user = user;
//       next();
//     }, () => {
//       next();
//     });
//   } catch (err) {
//     // Invalid object id
//     next();
//   }
// });
router.route('/user/:user_id?')
    .all(function(req, res, next) {
      // Access control
      next();
    })
    .get(function(req, res, next) {
      User.findById(req.params.user_id).then((user) => {
        res.json(user);
      }, function(err) {
        next(err);
      });
    })
    // Update only what's allowed
    .put(function(req, res) {
      if (req.user._id != req.params.user_id) {  //ANDREW CHECK THIS LINE FOR CORRECTIONS - BEN
        res.sendStatus(403);
      } else {
        const update = _.pick(req.body, ['username', 'email', 'name']);
        User.findByIdAndUpdate(req.params.user_id, {$set: update}, {new: true, runValidators: true}).then(function(updatedUser) {
          res.json(updatedUser);
        }, function(err) {
          res.sendStatus(400);
        });
      }
    })
    .post(function(req, res, next) {
      const newUser = _.omit(req.body, 'password');
      User.create(newUser).then(function(createdUser) {
        createdUser.setPassword(req.body.password);
        winston.info(`User ${createdUser.username} created.`);
        res.json(createdUser.excludeFields());
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      //if (req.user) {
      // Deletion will disable users not delete them
      User.findOneAndUpdate({_id: req.param.id}, {$set: {disabled: true}}, {new: true,
                                                                            runValidators: true})
          .then(function(disabledUser) {
            res.sendStatus(204);
          }, function() {
            next(new Error('Error disabling user'));
          });
      // } else {
      //   res.sendStatus(404);
      // }
    });

router.use('/users', function(req, res, next) {
  User.find().then((users) => {
    res.json(users);
  }, function(err) {
    next(err);
  });
});

module.exports = router;
