'use strict';

const mongoose = require('mongoose');

const validators = require('./validators');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  members: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  access: Boolean
});

groupSchema.path('name').validate({
  validator: validators.unique('Group', 'name'),
  isAsync: true,
  message: 'Group name must be unique'
});

module.exports = mongoose.model('Group', groupSchema);
