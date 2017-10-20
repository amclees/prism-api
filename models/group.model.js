'use strict';

require('dotenv').config();

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  members: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Group', groupSchema);
