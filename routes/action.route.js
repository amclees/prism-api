const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Action = mongoose.model('Action');

const settings = require('../lib/config/settings');

router.get('/actions', function(req, res, next) {
  // Once authentication is done, need to customize the query for non-admins
  const query = {};
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
