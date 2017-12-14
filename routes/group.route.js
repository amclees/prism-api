const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Group = mongoose.model('Group');

router.param('group_id', function(req, res, next, id) {
  req.id = id;
  try {
    Group.findOne({_id: mongoose.Types.ObjectId(id)}).then((group) => {
      req.group = group;
      next();
    }, () => {
      next();
    });
  } catch (err) {
    // Invalid object id
    next();
  }
});

router.route('/group/:group_id?')
    .all(function(req, res, next) {
      // Access control
      next();
    })
    .get(function(req, res) {
      if (req.group) {
        res.json(req.group);
      } else {
        res.sendStatus(404);
      }
    })
    .put(function(req, res) {
      if (req.group) {
        Group.findOneAndUpdate({_id: req.id}, {$set: {name: req.body.name}}, {new: true, runValidators: true}).then(function(updatedGroup) {
          res.json(updatedGroup);
        }, function(err) {
          res.sendStatus(400);
        });
      } else {
        res.sendStatus(404);
      }
    })
    .post(function(req, res) {
      if (req.group) {
        res.sendStatus(400);
      } else {
        Group.create(req.body).then(function(newGroup) {
          res.json(newGroup);
        }, function() {
          res.sendStatus(400);
        });
      }
    })
    .delete(function(req, res, next) {
      if (req.group) {
        Group.remove({_id: req.id}).then(function() {
          res.sendStatus(200);
        }, function() {
          next(new Error('Error deleting group'));
        });
      } else {
        res.sendStatus(400);
      }
    });

module.exports = router;
