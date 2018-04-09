'use strict';

const mongoose = require('mongoose');
const _ = require('lodash');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  files: {
    type: [{
      message: {
        type: String,
        required: true
      },
      filename: String,
      originalFilename: String,
      dateUploaded: {
        type: Date,
        default: Date.now
      },
      uploader: {
        type: {
          _id: {type: mongoose.Schema.Types.ObjectId, required: true},
          username: {type: String, required: true},
        },
        required: false
      },
    }],
    default: []
  },
  groups: {
    type: [String],
    default: ['Administrators']
  }



},                                  {usePushEach: true});

resourceSchema.methods.addFiles = function(message, user) {
  this.files.push({
    'message': message,
    'filename': null,
    'uploader': {
      'username': user.username,
      '_id': user._id
    }
  });
};

module.exports = mongoose.model('Resource', resourceSchema);
