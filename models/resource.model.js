'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  dateUploaded: {
    type: Date,
    default: Date.now
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  accessGroups: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  }
});

module.exports = mongoose.model('Resource', resourceSchema);
