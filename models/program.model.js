'use strict';

require('dotenv').config();

const mongoose = require('mongoose');

const settings = require('../lib/config/settings');
const validators = require('./validators');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: [settings.maxProgramNameLength, `The program name must be under ${settings.maxProgramNameLength} characters`]
  },
  documents: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  }
});

programSchema.path('name').validate({
  validator: validators.unique('Program', 'name'),
  isAsync: true,
  message: 'Program name must be unique'
});

programSchema.path('name').validate({
  validator: validators.noSpecialCharacters('name', true),
  isAsync: false,
  message: 'Invalid characters in program name'
});

programSchema.methods.documentObjects = function() {
  const Document = mongoose.model('Document');
  return Document.find({'_id': {'$in': this.documents}}).exec();
};

module.exports = mongoose.model('Program', programSchema);
