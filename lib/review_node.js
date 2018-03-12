'use strict';

const mongoose = require('mongoose');

module.exports = {
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
  },
  title: String
};
