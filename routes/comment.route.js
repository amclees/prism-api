const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Document = mongoose.model('Document');

router.route('/document/:document_id/comment/:comment_id')
.get(function(req, res, next) {
  Document.comments.findById(req.params.comment_id).then(function(comment) {
    if (comment === null) {
      next();
      return;
    }
    res.json(comment);
  }, function(err) {
    next(err);
  });
})
.patch(function(req, res, next) {
  Document.comments.findByIdAndUpdate(req.params.comment_id, {$set: req.body}, {new: true, runValidators: true}).then(function(updatedComment) {
    if (updatedComment === null) {
      next();
      return;
    }
    res.json(updatedComment);
    winston.info(`Updated comment with id ${req.params.comment_id}`);
  }, function(err) {
    next(err);
  });
})
.delete(function(req, res, next) {
  Document.comment.findByIdAndRemove(req.params.comment_id).then(function(removedComment) {
    if( removedComment === null) {
    next();
    return;
  }
    winston.info(`Deleted comment with id ${req.params.comment_id}.`);
  }, function(err) {
    next(err);
  });
});
