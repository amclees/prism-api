'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  currentRevision: {
    type: Number
  },
  allRevisions: {
    type: [{
      message: {
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
    }],
    default: []
  },
});

module.exports = mongoose.model('Document', documentSchema);
