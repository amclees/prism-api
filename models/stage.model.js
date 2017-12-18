'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');

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

stageSchema.post('init', function() {
  console.log('filled');
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
});

module.exports = mongoose.model('Stage', stageSchema);

function offsetDate(date, days) {
  const dateToAdjust = new Date(date.getTime());
  dateToAdjust.setDate(dateToAdjust.getDate() + days);
  return dateToAdjust;
}
