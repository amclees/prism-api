'use strict';

require('dotenv').config();

const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  abbreviation: {
    type: String,
    required: true
  },
  dean: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('College', collegeSchema);
