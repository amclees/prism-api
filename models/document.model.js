'use strict';

const mongoose = require('mongoose');
const winston = require('winston');

const settings = require('../lib/config/settings');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  revisions: {
    type: [{
      message: {
        type: String,
        required: true
      },
      filename: String,
      fileExtension: String,
      dateUploaded: {
        type: Date,
        default: Date.now
      },
      uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      template: Boolean,
      deleted: Boolean
    }],
    default: []
  },
  comments: {
    type: [{
      text: {
        type: String,
        required: true,
        maxLength: settings.maxCommentLength
      },
      author: {
        type: {
          _id: mongoose.Schema.Types.ObjectId,
          username: {type: String, required: true},
          name: {
            first: {type: String, required: true},
            last: {type: String, required: true}
          }
        },
        required: true
      },
      creationDate: {
        type: String,
        required: true
      },
      revision: {
        type: Number,
        required: true
      }
    }],
    default: []
  }
});

documentSchema.methods.validRevision = function(index) {
  return index >= 0 && index < this.revisions.length && !this.revisions[index].deleted;
};

documentSchema.methods.addRevision = function(message, uploader) {
  this.revisions.push({
    'message': message,
    'filename': null,
    'uploader': uploader
  });
};

documentSchema.methods.deleteRevision = function(toDelete) {
  const index = Number.parseInt(toDelete);
  return new Promise((resolve, reject) => {
    if (isNaN(index)) {
      reject(new Error('Index must be a number'));
      return;
    }
    if (this.revisions[index].template) {
      reject(new Error('Attempted to delete template revision'));
      return;
    }
    this.revisions[index].deleted = true;
    this.save().then(function() {
      resolve();
      winston.info(`Successfully deleted revision ${index} on document with id ${this._id.toString()}`);
    }, function(err) {
      reject(err);
    });
  });
};

module.exports = mongoose.model('Document', documentSchema);
