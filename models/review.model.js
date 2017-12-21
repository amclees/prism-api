'use strict';

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  program: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  stage: mongoose.Schema.Types.ObjectId
});

reviewSchema.methods.documentObjects = function() {
  const Document = mongoose.model('Document');
  return Document.find({'_id': {'$in': this.documents}}).exec();
};

module.exports = mongoose.model('Review', reviewSchema);
