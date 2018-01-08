'use strict';

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now(),
    required: true
  },
  canceled: {
    type: Boolean,
    default: false
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifications: {
    // Change includes date changes and cancellation
    change: {
      type: Boolean,
      default: true
    },
    dayBefore: {
      type: Boolean,
      default: true
    },
    sameDay: {
      type: Boolean,
      default: true
    }
  }
});

eventSchema.methods.addDocument = function(title) {

};

eventSchema.methods.changeDate = function(newDate, sendNotifications = true) {
  this.date = newDate;
  if (sendNotifications && this.notifications.change) {
    // Send the notifications via the email manager
  }
};

eventSchema.methods.cancel = function() {
  this.canceled = true;
  if (this.notifications.change) {
    // Send the notifications via the email manager
  }
};

module.exports = mongoose.model('Event', eventSchema);
