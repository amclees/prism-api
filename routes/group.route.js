const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Group = mongoose.model('Group');
const User = mongoose.model('User');

const actionLogger = require('../lib/action_logger');

router.route('/group/:group_id')
    .get(function(req, res, next) {
      Group.findById(req.params.group_id).then(function(group) {
        if (group === null) {
          next();
          return;
        }
        res.json(group);
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      Group.findByIdAndUpdate(req.params.group_id, {$set: req.body}, {runValidators: true}).then(function(oldGroup) {
        if (oldGroup === null) {
          next();
          return;
        }
        res.json({
          'name': req.body.name,
          'members': oldGroup.members
        });
        winston.info(`Updated group with id ${req.params.group_id}`);
        actionLogger.log(`renamed the group "${oldGroup.name}" to "${req.body.name}"`, req.user, 'group', oldGroup._id);
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Group.findByIdAndRemove(req.params.group_id).then(function(removedDocument) {
        if (removedDocument) {
          res.sendStatus(204);
          winston.info(`Removed group with id ${req.params.group_id}`);
        } else {
          res.sendStatus(404);
          winston.info(`Tried to remove nonexistent group with id ${req.params.group_id}`);
        }
      }, function(err) {
        next(err);
      });
    });

router.route('/group').post(function(req, res, next) {
  Group.create(req.body).then(function(newGroup) {
    res.status(201);
    res.json(newGroup);
    winston.info(`Created group with id ${newGroup._id}`);
    actionLogger.log(`created the group "${newGroup.name}"`, req.user, 'group', newGroup._id);
  }, function(err) {
    next(err);
    winston.info('Failed to create group with body:', req.body);
  });
});

router.route('/group/:group_id/member/:member_id')
    .put(function(req, res, next) {
      Group.findById(req.params.group_id).then(function(group) {
        if (group.members.indexOf(req.params.member_id) !== -1) {
          res.sendStatus(400);
          winston.info(`Tried to add already existing member ${req.params.member_id} to group with id ${req.params.group_id}`);
          return;
        }

        try {
          group.members.push(req.params.member_id);
        } catch (err) {
          res.sendStatus(400);
          winston.info(`Tried to add invalid ObjectId '${req.params.member_id}' to group with id ${req.params.group_id}`);
          return;
        }

        group.save().then(function(updatedGroup) {
          res.json(updatedGroup);
          winston.info(`Added member ${req.params.member_id} to group with id ${req.params.group_id}`);
          actionLogger.log(`added member to group ${updatedGroup.name}`, req.user, 'group', updatedGroup._id);
        }, function(err) {
          next(err);
          winston.error(`Failed to add member ${req.params.member_id} to group with id ${req.params.group_id}, error:`, err);
        });
      }, function(err) {
        err.status = 404;
        next(err);
        winston.info(`Tried to add member ${req.params.member_id} to nonexistent group with id ${req.params.group_id}`);
      });
    })
    .delete(function(req, res, next) {
      Group.findById(req.params.group_id).then(function(group) {
        const location = group.members.indexOf(req.params.member_id);
        if (location === -1) {
          res.sendStatus(404);
          winston.info(`Failed to delete nonexistent member ${req.params.member_id} from group with id ${req.params.group_id}`);
          return;
        }
        const removed = group.members.splice(location, 1)[0];
        group.save().then(function() {
          res.json(removed);
          winston.info(`Deleted member ${req.params.member_id} from group with id ${req.params.group_id}`);
          actionLogger.log(`removed member from group ${group.name}`, req.user, 'group', group._id);
        }, function(err) {
          next(err);
          winston.error(`Failed to delete member ${req.params.member_id} from group with id ${req.params.group_id}, error:`, err);
        });
      }, function(err) {
        err.status = 404;
        next(err);
        winston.info(`Tried to delete member ${req.params.member_id} from nonexistent group with id ${req.params.group_id}`);
      });
    });

router.get('/groups', function(req, res, next) {
  Group.find().exec().then(function(groups) {
    res.json(groups);
  }, function(err) {
    next(err);
    winston.error('Error fetching all groups:', err);
  });
});

module.exports = router;
