const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Group = mongoose.model('Group');
const User = mongoose.model('User');

const actionLogger = require('../lib/action_logger');

const access = require('../lib/access');

router.route('/group/:group_id')
    .all(access.allowGroups(['Administrators']))
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
      Group.findByIdAndUpdate(req.params.group_id, {$set: {'name': req.body.name}}, {runValidators: true}).then(function(oldGroup) {
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

router.route('/group').post(access.allowGroups(['Administrators']), function(req, res, next) {
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
    .all(access.allowGroups(['Administrators']))
    .put(function(req, res, next) {
      Group.findById(req.params.group_id).then(function(group) {
        if (group === null) {
          next();
          return;
        }
        User.findByIdAndUpdate(req.params.member_id).then(function(user) {
          if (user === null) {
            next();
            return;
          }
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

          user.groups.push(group._id);

          user.save().then(function() {
            group.save().then(function(updatedGroup) {
              res.json(updatedGroup);
              winston.info(`Added member ${req.params.member_id} to group with id ${req.params.group_id}`);
              actionLogger.log(`added member to group ${updatedGroup.name}`, req.user, 'group', updatedGroup._id);
            }, next);
          }, next);
        });
      }, next);
    })
    .delete(function(req, res, next) {
      Group.findById(req.params.group_id).then(function(group) {
        if (group === null) {
          next();
          return;
        }
        User.findByIdAndUpdate(req.params.member_id).then(function(user) {
          if (user === null) {
            next();
            return;
          }

          try {
            if (group.name === 'Administrators' && req.user._id.equals(mongoose.Types.ObjectId(req.params.member_id))) {
              const err = new Error('Administrators cannot remove themselves from the administrator group');
              err.status = 400;
              next(err);
              return;
            }
          } catch (err) {
            next(err);
            return;
          }
          const location = group.members.indexOf(req.params.member_id);
          const groupLocation = user.groups.indexOf(group._id);
          if (location === -1 && groupLocation === -1) {
            res.sendStatus(404);
            winston.info(`Failed to delete nonexistent member ${req.params.member_id} from group with id ${req.params.group_id}`);
            return;
          } else if (location === -1 || groupLocation === -1) {
            winston.warn(`User and Group membership records were not consistent when removing user with id ${req.params.member_id}`);
          }
          if (location !== -1) {
            group.members.splice(location, 1)[0];
          }
          if (groupLocation !== -1) {
            user.groups.slice(groupLocation, 1)[0];
          }

          user.save().then(function() {
            group.save().then(function() {
              res.sendStatus(204);
              winston.info(`Deleted member ${req.params.member_id} from group with id ${req.params.group_id}`);
              actionLogger.log(`removed member from group ${group.name}`, req.user, 'group', group._id);
            }, next);
          }, next);
        });
      }, function(err) {
        err.status = 404;
        next(err);
        winston.info(`Tried to delete member ${req.params.member_id} from nonexistent group with id ${req.params.group_id}`);
      });
    });

router.get('/prs', function(req, res, next) {
  Group.findOne({name: 'Program Review Subcommittee'}).populate('members').exec().then(function(group) {
    if (group === null) {
      winston.error('PRS group does not exist');
      return;
    }
    for (let i = 0; i < group.members.length; i++) {
      group.members[i] = group.members[i].excludeFields();
    }
    res.json(group);
  }, function(err) {
    next(err);
    winston.error('Error fetching PRS:', err);
  });
});

router.get('/groups', access.allowGroups(['Administrators']), function(req, res, next) {
  Group.find().exec().then(function(groups) {
    res.json(groups);
  }, function(err) {
    next(err);
    winston.error('Error fetching all groups:', err);
  });
});

module.exports = router;
