'use strict';

const mongoose = require('mongoose');

const Document = mongoose.model('Document');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
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
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

eventSchema.methods.addDocument = function(title) {
  return new Promise((resolve, reject) => {
    Document.create({
              'title': title
            })
        .then((createdDocument) => {
          this.documents.push(createdDocument._id);
          this.save().then(() => {
            resolve(createdDocument);
          }, reject);
        }, reject);
  });
};

eventSchema.methods.deleteDocument = function(document) {
  return new Promise((resolve, reject) => {
    const index = Number.parseInt(document);
    if (isNaN(index) || index < 0 || index >= this.documents.length) {
      reject(new Error('Invalid index to delete'));
      return;
    }
    this.documents[index].delete().then((deletedDocument) => {
      const mongoKey = 'documents.' + index;
      const mongoIndex = {};
      mongoIndex[mongoKey] = null;
      mongoose.model('Event').findByIdAndUpdate(this._id, {$set: mongoIndex}).then(function() {
        resolve(deletedDocument);
      }, reject);
    }, function(err) {
      reject(err);
    });
  });
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
