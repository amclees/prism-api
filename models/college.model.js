'use strict';

require('dotenv').config();

const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dean: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = mongoose.model('College', collegeSchema);
