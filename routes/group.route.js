const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Group = mongoose.model('Group');

router.route('/group/:group_id?')
    .get(function(req, res, next) {
      Group.findById(req.params.group_id).then(function(group) {
        res.json(group);
      }, function(err) {
        err.status = 404;
        next(err);
      });
    })
    .put(function(req, res, next) {
      Group.findByIdAndUpdate(req.params.group_id, {$set: {name: req.body.name}}, {new: true, runValidators: true}).then(function(updatedGroup) {
        res.json(updatedGroup);
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Group.remove({_id: req.params.group_id}).then(function() {
        res.sendStatus(204);
      }, function(err) {
        next(err);
      });
    });

router.route('/group').post(function(req, res, next) {
  Group.create(req.body).then(function(newGroup) {
    res.status(201);
    res.json(newGroup);
  }, function(err) {
    next(err);
  });
});

router.route('/group/:group_id/member/:member_id')
    .put(function(req, res, next) {
      Group.findById(req.params.group_id).then(function(group) {
        if (group.members.indexOf(req.params.member_id) !== -1) {
          res.sendStatus(400);
          return;
        }

        try {
          group.members.push(req.params.member_id);
        } catch (err) {
          res.sendStatus(400);
          return;
        }

        group.save().then(function(updatedGroup) {
          res.json(updatedGroup);
        }, function(err) {
          next(err);
        });
      }, function(err) {
        err.status = 404;
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Group.findById(req.params.group_id).then(function(group) {
        const location = group.members.indexOf(req.params.member_id);
        if (location === -1) {
          res.sendStatus(404);
          return;
        }
        const removed = group.members.splice(location, 1)[0];
        group.save().then(function() {
          res.json(removed);
        }, function(err) {
          next(err);
        });
      }, function(err) {
        err.status = 404;
        next(err);
      });
    });

router.get('/groups', function(req, res, next) {
  Group.find().exec().then(function(groups) {
    res.json(groups);
  }, function(err) {
    next(err);
  });
});

module.exports = router;
