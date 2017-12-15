const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Group = mongoose.model('Group');

router.param('group_id', function(req, res, next, groupId) {
  req.groupId = groupId;
  try {
    Group.findOne({_id: mongoose.Types.ObjectId(groupId)}).then((group) => {
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

router.param('member_id', function(req, res, next, memberId) {
  req.memberId = memberId;
  next();
});

router.route('/group/:group_id?')
    .get(function(req, res) {
      if (req.group) {
        res.json(req.group);
      } else {
        res.sendStatus(404);
      }
    })
    .put(function(req, res) {
      if (req.group) {
        Group.findOneAndUpdate({_id: req.groupId}, {$set: {name: req.body.name}}, {new: true, runValidators: true}).then(function(updatedGroup) {
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
          res.status(201);
          res.json(newGroup);
        }, function() {
          res.sendStatus(400);
        });
      }
    })
    .delete(function(req, res, next) {
      if (req.group) {
        Group.remove({_id: req.groupId}).then(function() {
          res.sendStatus(200);
        }, function() {
          next(new Error('Error deleting group'));
        });
      } else {
        res.sendStatus(400);
      }
    });

router.route('/group/:group_id/member/:member_id')
    .all(function(req, res, next) {
      if (req.group) {
        next();
      } else {
        res.sendStatus(400);
      }
    })
    .put(function(req, res, next) {
      if (req.group.members.indexOf(req.memberId) === -1) {
        Group.findOneAndUpdate({_id: req.groupId}, {$push: {members: req.memberId}}, {new: true, runValidators: true}).then(function(updatedGroup) {
          res.json(updatedGroup);
        }, function(err) {
          next(err);
        });
      } else {
        res.sendStatus(304);
      }
    })
    .delete(function(req, res, next) {
      if (req.group.members.indexOf(req.memberId) === -1) {
        res.sendStatus(404);
      } else {
        const location = req.group.members.indexOf(req.memberId);
        if (location === -1) {
          res.sendStatus(404);
        } else {
          const removed = req.group.members.splice(location, 1)[0];
          req.group.save().then(function() {
            res.json(removed);
          }, function(err) {
            next(err);
          });
        }
      }
    });

router.get('/groups', function(req, res, next) {
  Group.find().exec().then((groups) => {
    res.json(groups);
  }, (err) => {
    next(err);
  });
});

module.exports = router;
