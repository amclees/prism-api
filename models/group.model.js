'use strict';

const mongoose = require('mongoose');

const validators = require('./validators');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  members: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  access: Boolean
},
                                        {usePushEach: true});

groupSchema.path('name').validate({
  validator: validators.unique('Group', 'name'),
  isAsync: true,
  message: 'Group name must be unique'
});

module.exports = mongoose.model('Group', groupSchema);
