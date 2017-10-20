'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  creationDate: {
    type: String,
    required: true
  },
  version: {
    type: mongoose.Schema.Types.ObjectId
  }
});

module.exports = mongoose.model('Comment', commentSchema);
