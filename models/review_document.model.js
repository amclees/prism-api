'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
const Document = require('./document.model');

const reviewDocumentSchema = new mongoose.Schema({
  review: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  leadUser: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  expectedCompletion: {
    type: Date,
    required: true
  }
});

module.exports = Document.discriminator('ReviewDocument', reviewDocumentSchema);
