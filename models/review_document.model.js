'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
const Document = require('./document.model');

const reviewDocumentSchema = new mongoose.Schema({
  finalized: {
    type: Boolean,
    default: false
  },
  prerequisites: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  expectedCompletion: {
    type: Date,
    required: true
  }
});

module.exports = Document.discriminator('ReviewDocument', reviewDocumentSchema);
