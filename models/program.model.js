'use strict';

const mongoose = require('mongoose');

const settings = require('../lib/config/settings');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: [settings.maxProgramNameLength, `The program name must be under ${settings.maxProgramNameLength} characters`]
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  nextReviewDate: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('Program', programSchema);
