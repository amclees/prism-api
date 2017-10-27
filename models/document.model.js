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
  currentVersion: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  allVersions: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
});

module.exports = mongoose.model('Document', documentSchema);
