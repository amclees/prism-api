const winston = require('winston');

const mongoose = require('mongoose');
let Group;

const groups = ['Administrators', 'Program Review Subcommittee'];
const groupNameToId = {};
const groupIdToName = {};

module.exports.groupNameToId = groupNameToId;
module.exports.groupIdToName = groupIdToName;

module.exports.init = function() {
  Group = mongoose.model('Group');

  for (let group of groups) {
    /*eslint-disable no-loop-func */
    Group.findOne({name: group}).then(function(foundGroup) {
      if (foundGroup) {
        winston.info('Access control group already existed:', foundGroup.name);
        groupNameToId[group] = foundGroup._id;
        groupIdToName[foundGroup._id] = group;
      } else {
        const newGroup = new Group({
          name: group
        });
        newGroup.save().then(function(createdGroup) {
          winston.info('Created new access control group', createdGroup.name);
          groupNameToId[group] = createdGroup._id;
          groupIdToName[createdGroup._id] = group;
        }, function(err) {
          winston.error('Error creating access control group', err);
        });
      }
    }, function(err) {
      winston.error('Error finding single group', group, 'for access control initialization. Error:', err);
    });
    /*eslint-enable */
  }
};

const skipRoot = function(middleware) {
  return function(req, res, next) {
    if (req.user.root) {
      winston.info('Skipping access control because user is root');
      next();
    } else {
      middleware(req, res, next);
    }
  };
};

// For use in endpoints as a standalone middleware
const attachGroupsMiddleware = function(req, res, next) {
  req.groups = req.user.groups;
  next();
};
module.exports.attachGroups = attachGroupsMiddleware;

// For wrapping other middleware in the access module
const attachGroups = function(middleware) {
  return function(req, res, next) {
    req.groups = req.user.groups;
    middleware(req, res, next);
  };
};

module.exports.allowGroups = function(allowedGroups) {
  return attachGroups(skipRoot(function(req, res, next) {
    winston.debug('Performing group-based access control on user', req.user.username);
    for (let groupId of req.groups) {
      if (allowedGroups.indexOf(groupIdToName[groupId]) !== -1) {
        if (req.method !== 'GET') {
          winston.info(`Allowed user ${req.user.username} (id: ${req.user._id}) access to non-GET path ${req.method} ${req.path} based on group membership`);
        }
        next();
        return;
      }
    }
    winston.info(`Rejected access to ${req.path} for user ${req.user.username} (id: ${req.user._id}) due to lack of group membership`);
    res.sendStatus(403);
  }));
};

module.exports.allowDatabaseGroups = function(modelName, idKey, groupKey) {
  const model = mongoose.model(modelName);
  return attachGroups(function(req, res, next) {
    model.findById(req.params[idKey]).then(function(document) {
      if (document === null) {
        // True for 404 only
        next();
        return;
      }
      req[modelName.toLowerCase()] = document;
      if (req.user.root) {
        next();
        return;
      }
      try {
        const documentGroups = document[groupKey];
        winston.debug('Performing group-based access control on user', req.user.username);
        for (let groupId of req.groups) {
          if (documentGroups.indexOf(groupIdToName[groupId]) !== -1) {
            if (req.method !== 'GET') {
              winston.info(`Allowed user ${req.user.username} (id: ${req.user._id}) access to non-GET path ${req.method} ${req.path} based on group membership`);
            }
            next();
            return;
          }
        }
        winston.info(`Rejected access to ${req.path} for user ${req.user.username} (id: ${req.user._id}) due to lack of group membership`);
        res.sendStatus(403);
      } catch (err) {
        winston.error('Error performing access control based on groups attached to a database document');
        next(err);
      }
    }, next);
  });
};
