'use strict';

const winston = require('winston');
const mongoose = require('mongoose');
const _ = require('lodash');

const nodeType = {
  startDate: Date,
  finishDate: Date,
  completionEstimate: Number,
  finishDateOverriden: Boolean,
  finalized: Boolean,
  email: Object,
  document: mongoose.Schema.Types.ObjectId,
  prerequisites: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  }
};

const stageSchema = new mongoose.Schema({
  endNodes: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  nodes: {
    type: Object,
    default: {}
  }
});

stageSchema.path('nodes').validate({
  validator: nodeValidator,
  isAsync: false,
  message: 'Invalid nodes in Stage'
});

stageSchema.post('init', function() {
  recalculateDates.bind(this)();
});

module.exports = mongoose.model('Stage', stageSchema);

function recalculateDates() {
  winston.debug('Calculating dates for Stage');
  let safety = 1000;
  const fillNodeDate = (nodeId) => {
    if (safety-- <= 0) {
      winston.log('error', 'Exceeded limit to node count in calculating date estimates in Stage');
      return 0;
    }

    const node = this.nodes[nodeId];

    if (node.finishDateOverriden || node.finalized) {
      node.recalculated = true;
      return;
    }

    let prerequisiteFinishDate = new Date(0);
    if (node.prerequisites.length === 0) {
      prerequisiteFinishDate = new Date(node.startDate);
    } else {
      for (let prerequisiteId of node.prerequisites) {
        const prerequisite = this.nodes[prerequisiteId];
        if (!prerequisite.recalculated) {
          fillNodeDate(prerequisiteId);
        }
        if (prerequisite.finishDate > prerequisiteFinishDate) {
          prerequisiteFinishDate = prerequisite.finishDate;
        }
      }
    }

    node.startDate = prerequisiteFinishDate;
    node.finishDate = offsetDate(prerequisiteFinishDate, node.completionEstimate);
    node.recalculated = true;
  };

  for (let endNode of this.endNodes) {
    fillNodeDate(endNode);
  }
}

function offsetDate(date, days) {
  const dateToAdjust = new Date(date.getTime());
  dateToAdjust.setDate(dateToAdjust.getDate() + days);
  return dateToAdjust;
}

function nodeValidator(nodes) {
  return _.size(_.keys(nodes)) <= 1000 && _.every(_.values(nodes), validNode);
}

function validNode(node) {
  winston.info('validating node', node);
  let valid = 'nan';
  try {
    valid = _.size(_.keys(node)) <= _.size(_.keys(nodeType)) && _.every(_.keys(node), function(key) {
      return _.has(nodeType, key) && validValue(key, node[key]);
    });
  } catch (err) {
    winston.error(err);
  }
  winston.info('the node is valid:', valid);
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
  'prerequisites': validPrerequisites
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
