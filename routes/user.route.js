const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = mongoose.model('User');

const _ = require('lodash');

router.param('user_id', function(req, res, next, id) {
  req.id = id;
  try {
    User.findOne({_id: mongoose.Types.ObjectId(id)}).then((user) => {
      req.user = user;
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
      res.json(req.user));
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
    const update = _.pick(req.body, ['username', 'email', 'name']);
    User.findOneAndUpdate({_id: req.id}, {$set: {username: req.body.username,
      email: req.body.email, name: req.body.name}}, {new: true,
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
      User.create(req.body).then(function(newUser) {
        res.json(newUser);
      }, function() {
        res.sendStatus(400);
      });
    }
  })
  .delete(function(req, res, next) {
    if (req.user) {
      User.remove({_id: req.id}).then(function(){
        res.sendStatus(204);
      }, function() {
        next(new Error('Error deleting user'));
      });
    } else {
      res.sendStatus(404);
    }
  })

module.exports = router;
