'use strict';

require('dotenv').config();

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  chair: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Department', departmentSchema);
