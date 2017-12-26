const winston = require('winston');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Document = mongoose.model('Document');
const Comment = mongoose.model('Comment');

router.route('/document/:document_id')
    .get(function(req, res, next) {
      Document.findById(req.params.document_id).populate('comments').then(function(document) {
        res.json(document);
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      for (let property of req.body) {
        if (!(property === 'title' || property === 'currentRevision')) {
          res.sendStatus(400);
          return;
        }
      }
      Document.findByIdAndUpdate(req.params.document_id, {$set: req.body}, {new: true, runValidators: true}).then(function(updatedDocument) {
        res.json(updatedDocument);
        winston.info(`Updated document with id ${req.params.document_id}`);
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Document.findByIdAndRemove(req.params.document_id).then(function() {
        res.sendStatus(204);
        winston.info(`Deleted document with id ${req.params.document_id}`);
        Comment.remove({document: req.params.document_id}).then(function() {
          winston.info(`Deleted all comments on document ${req.params.document_id}`);
        }, function(err) {
          winston.err('Error deleting all document comments', err);
        });
      }, function(err) {
        next(err);
      });
    });

// POST endpoint here is for testing, the final application will post to a review or event based endpoint
router.route('/document').post(function(req, res, next) {
  Document.create(req.body).then(function(newDocument) {
    res.status(201);
    res.json(newDocument);
    winston.info(`Created document with id ${newDocument._id}`);
  }, function(err) {
    next(err);
    winston.info('Failed to create document with body:', req.body);
  });
});

router.route('/document/:document_id/comment/:comment_id');
router.route('/document/:document_id/comment');

router.route('/document/:document_id/revision/:revision').delete(function(req, res, next) {

});

router.route('/document/:document_id/revision').post(function(req, res, next) {

});

module.exports = router;
