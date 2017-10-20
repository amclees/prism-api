'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');

const accessGroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true
  },
  members: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('AccessGroup', accessGroupSchema);
