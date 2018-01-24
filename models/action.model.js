'use strict';

const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Type and Object are for use by the client-side to provide shortcuts to affected objects
  // Type indicates what type of object the action affects
  type: {
    type: String,
    default: 'none'
  },
  // Object is the object affected by the action
  object: mongoose.Schema.Types.ObjectId
});

actionSchema.path('type').validate({
  validator: function(type) {
    return ['college', 'department', 'document', 'event', 'group', 'program', 'review', 'review', 'user'].includes(type);
  },
  isAsync: false,
  message: 'Action must have a valid type, see list of action types'
});

actionSchema.methods.excludeFieldsFromUsers = function() {
  const excluded = this.toObject();
  if (this.user) {
    excluded.user = this.user.excludeFields();
  }
  return excluded;
};

module.exports = mongoose.model('Action', actionSchema);
