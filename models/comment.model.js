'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required:true

  },
  author: {
    type: String,
    required:true
  },
  creationDate: {
    type: String,
    required: true
  },
  mongoUID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = mongoose.model('Comment', resourceSchema);
