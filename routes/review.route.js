const winston = require('winston');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Document = mongoose.model('Document');
const Review = mongoose.model('Review');

const documentFactory = require('../lib/document_factory');
const reviewFactory = require('../lib/review_factory');

const access = require('../lib/access');
const actionLogger = require('../lib/action_logger');

router.route('/review/:review_id')
    .get(function(req, res, next) {
      Review.findById(req.params.review_id).then(function(review) {
        if (review === null || review.deleted) {
          next();
          return;
        }
        res.json(review);
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      for (let property of _.keys(req.body)) {
        if (['program', 'leadReviewers'].indexOf(property) === -1) {
          res.sendStatus(400);
          return;
        }
      }
      Review.findByIdAndUpdate(req.params.review_id, {$set: req.body}, {new: true, runValidators: true}).then(function(review) {
        if (review === null || review.deleted) {
          next();
          return;
        }
        res.json(review);
        winston.info(`Updated review with id ${req.params.review_id}`);
        actionLogger.log('updated a review', req.user, 'review', review._id, '');
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Review.findByIdAndUpdate(req.params.review_id, {deleted: true}).then(function(review) {
        if (review === null) {
          res.sendStatus(404);
        } else {
          res.sendStatus(204);
          winston.info(`Deleted review with id ${req.params.review_id}`);
        }
      }, next);
    });

router.post('/review/:review_id/restore', function(req, res, next) {
  Review.findByIdAndUpdate(req.params.review_id, {deleted: false}).then(function(review) {
    if (review === null) {
      res.sendStatus(404);
    } else {
      res.sendStatus(204);
      winston.info(`Restored review with id ${req.params.review_id}`);
    }
  }, next);
});

router.route('/review').post(function(req, res, next) {
  reviewFactory.getReview(req.body).then(function(newReview) {
    newReview.recalculateDates();
    newReview.save().then(function() {
      res.status(201);
      res.json(newReview);
      winston.info(`Created review with id ${newReview._id}`);
      actionLogger.log(`created a new review`, req.user, 'review', newReview._id);
    }, next);
  }, function(err) {
    next(err);
    winston.info('Failed to create review with body:', req.body);
  });
});

router.post('/review/:review_id/node/:node_id/finalize', function(req, res, next) {
  Review.findById(req.params.review_id).then(function(review) {
    if (review === null || review.deleted || !review.nodes[req.params.node_id]) {
      next();
      return;
    }
    if (review.nodes[req.params.node_id].finalized) {
      res.sendStatus(400);
      return;
    }
    Document.findByIdAndUpdate(review.nodes[req.params.node_id].document, {locked: true}).then(function(lockedDocument) {
      if (lockedDocument === null) {
        next(new Error(`Invalid document id ${review.nodes[req.params.node_id].document} on review ${review._id}`));
        return;
      }
      review.nodes[req.params.node_id] = true;
      review.recalculateDates();
      review.markModified('nodes');
      review.save().then(function() {
        res.json(review);
      }, next);
    }, next);
  }, function(err) {
    next(err);
  });
});

router.patch('/review/:review_id/node/:node_id', function(req, res, next) {
  if (_.keys(req.body).length !== 1 || !(req.body.finishDate || req.body.finishDate === null)) {
    res.sendStatus(400);
    return;
  }
  Review.findById(req.params.review_id).then(function(review) {
    if (review === null || review.deleted || !review.nodes[req.params.node_id]) {
      next();
      return;
    }
    if (review.nodes[req.params.node_id].finalized) {
      res.sendStatus(400);
      return;
    }

    if (req.body.finishDate === null) {
      review.nodes[req.params.node_id].finishDate = null;
      review.nodes[req.params.node_id].finishDateOverriden = false;
    } else {
      review.nodes[req.params.node_id].finishDate = new Date(req.body.finishDate);
      review.nodes[req.params.node_id].finishDateOverriden = true;
    }

    review.recalculateDates();
    review.markModified('nodes');

    review.save().then(function() {
      res.json(review);
    }, next);
  }, function(err) {
    next(err);
  });
});

router.post('/review/:review_id/node', function(req, res, next) {
  Review.findById(req.params.review_id).then(function(review) {
    if (review === null || review.deleted) {
      next();
      return;
    }

    if (req.body.template) {
      documentFactory.getDocumentFromTemplate(req.body.template).then(function(document) {
        document.save().then(afterSaveHandler, next);
      }, next);
    } else {
      (new Document({
        'title': req.body.title,
        'groups': req.body.groups
      })).save()
          .then(afterSaveHandler, next);
    }

    function afterSaveHandler(document) {
      const newNodeId = mongoose.Types.ObjectId();
      review.endNodes.push(newNodeId);
      review.nodes[newNodeId] = {
        'document': document._id,
        'completionEstimate': document.completionEstimate || req.body.completionEstimate,
        'prerequisites': []
      };
      review.recalculateDates();
      review.markModified('nodes');

      review.save().then(function(savedReview) {
        res.json(savedReview);
      }, next);
    }
  }, function(err) {
    next(err);
  });
});

router.get('/reviews', access.allowGroups(['Administrators']), function(req, res, next) {
  const query = {};
  if (!req.user.root && _.map(req.groups, 'name').indexOf('Administrators') === -1) {
    query.deleted = false;
  }

  Review.find(query, 'program startDate leadReviewers deleted').exec().then(function(reviews) {
    res.json(reviews);
  }, function(err) {
    next(err);
    winston.error('Error fetching all reviews:', err);
  });
});

module.exports = router;
