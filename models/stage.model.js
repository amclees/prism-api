'use strict';

const mongoose = require('mongoose');

const nodeType = {
  startDate: Date,
  finishDate: Date,
  completionEstimate: Number,
  finishDateOverriden: Boolean,
  finalized: Boolean,
  email: Object,
  prerequisites: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  }
};

const stageSchema = new mongoose.Schema({
  endNodes: {
    type: [nodeType],
    default: []
  },
  nodes: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('Stage', stageSchema);
