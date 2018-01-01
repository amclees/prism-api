'use strict';

const mongoose = require('mongoose');
const winston = require('winston');

const fileUtils = require('../lib/file_utils.js');

const notDeleted = function() {
  return !this.deleted;
};

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  currentRevision: {
    type: Number
  },
  revisions: {
    type: [{
      message: {
        type: String,
        required: notDeleted
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
        required: notDeleted
      },
      deleted: Boolean,
      template: Boolean
    }],
    default: []
  },
  comments: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    default: []
  }
});

documentSchema.methods.validRevision = function(index) {
  return index >= 0 && index < this.revisions.length && !this.revisions[index].deleted;
};

documentSchema.methods.setRevision = function(index) {
  try {
    winston.debug('Setting document currentRevision');
    if (index === undefined) {
      winston.info('Setting revision to undefined');
      this.currentRevision = index;
      return true;
    } else if (this.validRevision(index)) {
      winston.info(`Setting revision to index ${index}`);
      this.currentRevision = index;
      return true;
    } else {
      winston.error(`Attempted to set revision to ${index} but it was invalid`);
      return false;
    }
  } catch (err) {
    winston.error('Error setting revision', err);
    return false;
  }
};

documentSchema.methods.addRevision = function(message, filename, uploader) {
  this.revisions.push({
    'message': message,
    'filename': filename,
    'uploader': uploader
  });
};

documentSchema.methods.deleteRevision = function(toDelete) {
  const index = Number.parseInt(toDelete);
  return new Promise((resolve, reject) => {
    if (isNaN(index)) {
      reject(new Error('currentRevision must be a number'));
      return;
    }
    if (this.revisions[index].template) {
      reject(new Error('Attempted to delete template revision'));
      return;
    }
    fileUtils.deleteFile(this.revisions[index].filename).then(() => {
      if (this.currentRevision === index) {
        this.currentRevision = undefined;
      }
      this.revisions[index] = {
        deleted: true
      };
      winston.info('Successfully deleted version file');
      this.save().then(function() {
        resolve();
      }, function(err) {
        reject(err);
      });
    }, function(err) {
      reject(err);
    });
  });
};

module.exports = mongoose.model('Document', documentSchema);
