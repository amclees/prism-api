'use strict';

const winston = require('winston');
const _ = require('lodash');

module.exports.recalculateDates = function() {
  if (!this.endNodes || !this.nodes) {
    return;
  }
  winston.debug('Calculating dates for Review');
  let safety = 1000;
  const fillNodeDate = (nodeId) => {
    if (safety-- <= 0) {
      winston.log('error', 'Exceeded limit to node count in calculating date estimates in Review');
      return 0;
    }

    const node = this.nodes[nodeId];

    if (node.finishDateOverriden || node.finalized) {
      node.recalculated = true;
      return;
    }

    let prerequisiteFinishDate = node.startDate ? new Date(node.startDate) : new Date();
    for (let prerequisiteId of node.prerequisites) {
      const prerequisite = this.nodes[prerequisiteId];
      if (!prerequisite.recalculated) {
        fillNodeDate(prerequisiteId);
      }
      if (prerequisite.finishDate > prerequisiteFinishDate) {
        prerequisiteFinishDate = prerequisite.finishDate;
      }
    }

    node.startDate = prerequisiteFinishDate;
    node.finishDate = offsetDate(prerequisiteFinishDate, node.completionEstimate);
    if (node.finishDate < new Date()) {
      node.finishDate = delayedFinishDate(node);
    }
    node.recalculated = true;
  };

  for (let endNode of this.endNodes) {
    fillNodeDate(endNode);
  }

  for (let node of _.values(this.nodes)) {
    node.recalculated = undefined;
  }
};

function offsetDate(date, days) {
  const dateToAdjust = new Date(date.getTime());
  dateToAdjust.setDate(dateToAdjust.getDate() + days);
  return dateToAdjust;
}

function delayedFinishDate() {
  // 86400000 ms is one day
  return new Date((new Date()).getTime() + 86400000);
}
