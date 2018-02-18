const winston = require('winston');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Action = mongoose.model('Action');

const access = require('../lib/access');
const settings = require('../lib/config/settings');

router.get('/actions', access.attachGroups, function(req, res, next) {
  const query = {};
  if (!req.user.root && _.map(req.groups, 'name').indexOf('Administrators') === -1) {
    query.user = req.user._id;
  } else if (req.query.user) {
    query.user = req.query.user;
  }

  const page = req.query.page ? req.query.page : 0;
  Action.find(query).sort({date: 'desc'}).limit(settings.actionsPerPage).skip(settings.actionsPerPage * page).populate('user').exec().then(function(actions) {
    const excludedActions = [];
    for (let action of actions) {
      excludedActions.push(action.excludeFieldsFromUsers());
    }
    res.json(excludedActions);
  }, function(err) {
    next(err);
    winston.error('Error fetching all actions:', err);
  });
});

module.exports = router;
