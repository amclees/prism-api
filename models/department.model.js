'use strict';

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
  chair: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = mongoose.model('Department', departmentSchema);
