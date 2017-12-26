'use strict';

const mongoose = require('mongoose');

const notDeleted = function() {
  return !this.deleted;
};

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  currentRevision: {
    type: Number,
    validate: {
      validator: function(value) {
        return value === undefined || (value > 0 && value < this.allRevisions.length);
      }
    }
  },
  revisions: {
    type: [{
      message: {
        type: String,
        required: notDeleted
      },
      filePath: {
        type: String,
        required: notDeleted
      },
      dateUploaded: {
        type: Date,
        default: Date.now
      },
      uploader: {
        type: mongoose.Schema.Types.ObjectId,
        required: notDeleted
      },
      deleted: Boolean
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

module.exports = mongoose.model('Document', documentSchema);
