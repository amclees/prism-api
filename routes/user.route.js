const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = mongoose.model('User');

const _ = require('lodash');

router.param('user_id', function(req, res, next, id) {
  req.id = id;
  try {
    User.findOne({_id: mongoose.Types.ObjectId(id)}).then((user) => {
      req.user = user.excludeFields();
      next();
    }, () => {
      next();
    });
  } catch (err) {
    // Invalid user id
    next();
  }
});

router.route('/user/:user_id?')
  .all(function(req, res, next) {
    // Access control
    next();
  })
  .get(function(req, res, next) {
    if (req.user) {
      // Excludes passwordHash field
      res.json(_.omit(req.user, 'passwordHash'));
    } else {
      res.sendStatus(404);
    }
  })
  // Update only what's allowed
  .put(function(req, res, next) {
    if(req.user.username != req.params.username) {
      res.sendStatus(403);
      next();
    }
    // {username: req.body.username, email: req.body.email, name: req.body.name}}
    const update = _.pick(req.body, ['username', 'email', 'name']);
    User.findOneAndUpdate({_id: req.id}, {$set: update, {new: true,
        runValidators: true}).then(function(updatedUser) {
      res.json(updatedUser);
    }, function(err) {
      res.sendStatus(400);
    });
  })
  .post(function(req, res, next) {
    if(req.user) {
      res.sendStatus(400);
    } else {
      const newUser = _.omit(req.body, 'password');
      User.create(newUser).then(function(createdUser) {
        if(createdUser.setPassword(req.body.password)){
          res.sendStatus(201);
        } else {
          User.remove(createdUser).then(function(){
            res.sendStatus(400);
          }, function() {
            next(new Error('Error deleting user'));
          });
          res.sendStatus(400);
        }
      }, function() {
        res.sendStatus(400);
      });
    }
  })
  // Deletion will disable users not delete them
  .delete(function(req, res, next) {
    if (req.user) {
      User.findOneAndUpdate({_id: req.id}, {$set: {enabled: false}, {new: true,
        runValidators:true}).then(function(disabledUser){
          res.sendStatus(204);
      }, function() {
        next(new Error('Error disabling user'));
      });
    } else {
      res.sendStatus(404);
    }
  })

module.exports = router;
