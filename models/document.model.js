'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required:true

  },
  program: {
    type: String,
    required:true
  },
  leadUser: {
    type: String,
    required: true
  },
  currVersion: {
    type: String,
    required: true
  },
  allVersions: {
    type: String,
    required: true
  },
  expectedCompletion: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Document', resourceSchema);
