const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Document = mongoose.model('Document');

router.route('/document/:document_id/comment/:comment_id')
.patch(function(req, res, next) {
  Document.findById(req.params.document_id).then(function(document) {
    if (document === null) {
      next();
      return;
    }
    const comments_index = Number.parseInt(req.params.comment_id);
    document.comments[comments_index].text = req.body.text;
    document.save().then(function(){
      res.sendSatus(200);
    });
    winston.info(`Updated comment with id ${req.params.comment_id}`);
  }, function(err) {
    next(err);
  });
})
.delete(function(req, res, next) {
  Document.findById(req.params.document_id).then(function(document) {
    document.deleteComment(req.params.comment, true).then(function() {
      res.sendStatus(204);
      winston.info(`Deleted comment ${req.params.comment} on document ${req.params.document_id}`);
    }, function(err) {
      next(err);
      winston.info(`Error deleting comment ${req.params.comment} on document ${req.params.document_id}`);
    });
  }, function(err) {
    next(err);
    winston.info(`Failed to find document with id ${req.params.document_id} for comment deletion`);
  });
});

router.route('/document/:document_id/comment').post(function(req,res,next) {
  Document.findById(req.params.document_id).then(function(document) {
    if(document === null ) {
      next();
      return;
    }
    document.comments.push({
      'text': req.params.text,
      'author': req.params.author,
      'creationDate': Date.now,
      'revision': req.params.revision
    });
    document.save().then(function(){
      res.sendSatus(200);
    });
    winston.info(`Created comment with id ${req.params.document_id}.`);
  }, function(err) {
    next(err);
  });
});

module.exports = router;
