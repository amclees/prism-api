'use strict';

require('dotenv').config();

const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  expectedCompletion: {
    type: Date,
    required: true
  },
  currentRevision: {
    type: Number
  },
  dateUploaded: {
    type: Date,
    default: Date.now
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = mongoose.model('Template', templateSchema);
