'use strict';

const winston = require('winston');
const _ = require('lodash');

/*
 When bound to a Review and run, this function will:
   Set startDate on all nodes to be:
     If prerequisites are not all finished:
       The latest finishDate of all the prerequisites
     Otherwise:
       The startDate if it was already set, otherwise the current date
   Set finishDate on all nodes to be:
     What it was before, if the node is finalized or finishDateOverriden
     Its startDate + completionEstimate
*/
module.exports.recalculateDates = function() {
  // Do not need to run if this object has no nodes (applicable in GET /reviews)
  if (!this.endNodes || !this.nodes) {
    return;
  }

  winston.debug('Calculating dates for Review');

  let reviewFinishDate = new Date();
  for (let endNode of this.endNodes) {
    let finishDate = fillNodeDate.bind(this)(endNode);
    if (finishDate > reviewFinishDate) {
      reviewFinishDate = finishDate;
    }
  }

  this.finishDate = reviewFinishDate;

  // Cleanup of recalculated flags
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

function fillNodeDate(nodeId) {
  const node = this.nodes[nodeId];

  if (node.finishDateOverriden || node.finalized) {
    node.recalculated = true;
    return;
  }

  node.startDate = calculateStartDate.bind(this)(node);
  node.finishDate = offsetDate(node.startDate, node.completionEstimate);

  // Delayed nodes need to have their finishDate adjusted for property
  // estimates of the finishDates of nodes depending on them.
  if (node.finishDate < new Date()) {
    node.finishDate = delayedFinishDate(node);
  }

  node.recalculated = true;
  return node.finishDate;
}

function calculateStartDate(node) {
  // Start with the existing start date, or initialize it to the current date
  let estimatedStartDate = new Date();

  let canStartNow = true;
  for (let prerequisiteId of node.prerequisites) {
    const prerequisite = this.nodes[prerequisiteId];
    if (!prerequisite.recalculated) {
      fillNodeDate.bind(this)(prerequisiteId);
    }
    if (!prerequisite.finalized) {
      canStartNow = false;
    }
    // Change the estimate if prerequisites affect when the node can start
    if (prerequisite.finishDate > estimatedStartDate) {
      estimatedStartDate = prerequisite.finishDate;
    }
  }

  if (canStartNow && node.startDate) {
    estimatedStartDate = new Date(node.startDate);
  }

  return estimatedStartDate;
}
