'use strict';

const mongoose = require('mongoose');

const settings = require('../lib/config/settings');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxLength: settings.maxCommentLength
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creationDate: {
    type: String,
    required: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId
  },
  revision: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Comment', commentSchema);
