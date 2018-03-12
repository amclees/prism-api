'use strict';

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  filename: String,
  fileExtension: String,
  dateUploaded: {
    type: Date,
    default: Date.now
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groups: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }


});

module.exports = mongoose.model('Resource', resourceSchema);
