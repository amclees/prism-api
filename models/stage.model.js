'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
const _ = require('lodash');

// For use in verification later on
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

stageSchema.pre('init', function(next) {
  let safety = 1000;
  const fillNodeDate = (nodeId) => {
    if (safety-- <= 0) {
      winston.log('error', 'Exceeded limit to node count in calculating date estimates in Stage');
      return 0;
    }

    const node = this.nodes[nodeId];

    if (node.finishDateOverriden) {
      node.recalculated = true;
      return;
    }

    let soonestStartDate = new Date(Number.MAX_VALUE);
    if (nodeId.prerequisites.length === 0) {
      soonestStartDate = new Date(Date.now());
    } else {
      for (let prerequisite of _.map(node.prerequisites, (prerequisiteId) => {
             return this.nodes[prerequisiteId];
           })) {
        if (!prerequisite.recalculated) {
          fillNodeDate(prerequisite);
        }
        if (prerequisite.finishDate < soonestStartDate) {
          soonestStartDate = prerequisite.finishDate;
        }
      }
    }
    node.finishDate = offsetDate(soonestStartDate, node.completionEstimate);
    node.recalculated = true;
  };

  for (let endNode of this.endNodes) {
    fillNodeDate(endNode);
  }

  next();
});

module.exports = mongoose.model('Stage', stageSchema);

function offsetDate(date, days) {
  const dateToAdjust = new Date(this.valueOf());
  dateToAdjust.setDate(dateToAdjust.getDate() + days);
  return dateToAdjust;
}
