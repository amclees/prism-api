'use strict';

const mongoose = require('mongoose');

const externalUploadSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    minlength: 64,
    maxlength: 64
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Document'
  },
  completed: Boolean
},
                                                 {usePushEach: true});

module.exports = mongoose.model('ExternalUpload', externalUploadSchema);
