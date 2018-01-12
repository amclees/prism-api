'use strict';

const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  abbreviation: {
    type: String,
    required: true
  },
  deans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {usePushEach: true});

module.exports = mongoose.model('College', collegeSchema);
