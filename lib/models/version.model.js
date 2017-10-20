'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionMessage: {
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
  }
});

module.exports = mongoose.model('Version', versionSchema);
