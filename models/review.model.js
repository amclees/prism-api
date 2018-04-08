'use strict';

const winston = require('winston');
const mongoose = require('mongoose');
const _ = require('lodash');

const reviewDateEstimation = require('../lib/review_date_estimation');

const nodeType = require('../lib/review_node');

const reviewSchema = new mongoose.Schema({
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  finishDate: {
    type: Date
  },
  leadReviewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  externalUploads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  endNodes: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  nodes: {
    type: Object,
    default: {}
  },
  deleted: Boolean
},
                                         {usePushEach: true});

reviewSchema.path('nodes').validate({
  validator: nodeValidator,
  isAsync: false,
  message: 'Invalid nodes in Review'
});

reviewSchema.post('init', reviewDateEstimation.recalculateDates);
reviewSchema.methods.recalculateDates = reviewDateEstimation.recalculateDates;

module.exports = mongoose.model('Review', reviewSchema);



function nodeValidator(nodes) {
  return _.size(_.keys(nodes)) <= 1000 && _.every(_.values(nodes), validNode);
}

function validNode(node) {
  winston.debug('validating node', node);
  let valid = 'nan';
  try {
    valid = _.size(_.keys(node)) <= _.size(_.keys(nodeType)) && _.every(_.keys(node), function(key) {
      if (key === 'recalculated') return true;
      return _.has(nodeType, key) && validValue(key, node[key]);
    });
  } catch (err) {
    winston.error(err);
  }
  winston.debug('the node is valid:', valid);
  return valid;
}

const nodeValidators = {
  'startDate': _.isDate,
  'finishDate': _.isDate,
  'completionEstimate': _.isNumber,
  'finishDateOverriden': _.isBoolean,
  'finalized': _.isBoolean,
  'email': validEmailSettings,
  'document': validObjectId,
  'prerequisites': validPrerequisites,
  'title': _.isString
};

function validValue(key, value) {
  return nodeValidators[key](value);
}

function validEmailSettings(value) {
  try {
    return _.every(_.toPairs(value), function(pair) {
      _.every(pair, _.isString);
    });
  } catch (err) {
    return false;
  }
}

function validPrerequisites(value) {
  return _.isArray(value) && _.every(value, validObjectId);
}

function validObjectId(value) {
  try {
    mongoose.Types.ObjectId(value);
    return true;
  } catch (err) {
    return false;
  }
}
