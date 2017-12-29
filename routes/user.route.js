const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = mongoose.model('User');

const _ = require('lodash');

const winston = require ('winston');
winston.level = process.env.LOG_LEVEL || 'info';

router.param('user_id', function(req, res, next, id) {
  req.id = id;
  try {
    User.findById(id).then((user) => {
      req.user = user;
      next();
    }, () => {
      next();
    });
  } catch (err) {
    // Invalid object id
    next();
  }
});

router.route('/user/:user_id?')
  .all(function(req, res, next) {
    var awesome_instanc = new User({
    "username": "Drdsdf009",
    "email": "benjairsolis@yahoo.com",
    "internal": true,
    "enabled": true,
    "root": false,
    "name": {
        "first": "Diucdsgf",
        "last": "Sudcd"
    }
});

    // Save the new model instance, passing a callback
    awesome_instance.save(function (err) {
      if (err) return handleError(err);
      // saved!
    });
    // Access control
    next();
  })
  .get(function(req, res, next) {
    if (req.user) {
      res.json(_.omit(req.user, ['passwordHash', 'enabled']));
    } else {
      res.sendStatus(404);
    }
  })
  // Update only what's allowed
  .put(function(req, res, next) {
    if(req.user.username != req.params.username) {
      res.sendStatus(403);
    }
    // {username: req.body.username, email: req.body.email, name: req.body.name}}
    const update = _.pick(req.body, ['username', 'email', 'name']);
    User.findOneAndUpdate({_id: req.id}, {$set: update}, {new: true,
        runValidators: true}).then(function(updatedUser) {
      res.json(updatedUser);
    }, function(err) {
      res.sendStatus(400);
    });
  })
  .post(function(req, res, next) {
    const newUser = _.omit(req.body, 'password');
    User.create(newUser).then(function(createdUser) {
      createdUser.setPassword(req.body.password);
      winston.info(`User ${createdUser.username} created.`);
      res.json(createdUser.excludeFields());
    }, function(err) {
      next(new Error(err));
    });
  })
  .delete(function(req, res, next) {
    //if (req.user) {
      // Deletion will disable users not delete them
      User.findOneAndUpdate({_id: req.param.id}, {$set: {enabled: false}}, {new: true,
        runValidators:true}).then(function(disabledUser){
          res.sendStatus(204);
      }, function() {
        next(new Error('Error disabling user'));
      });
    // } else {
    //   res.sendStatus(404);
    // }
  })

module.exports = router;
