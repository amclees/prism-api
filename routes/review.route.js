const winston = require('winston');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Review = mongoose.model('Review');

const reviewFactory = require('../lib/review_factory');

const access = require('../lib/access');
const actionLogger = require('../lib/action_logger');

router.route('/review/:review_id')
    .get(function(req, res, next) {
      Review.findById(req.params.review_id).then(function(review) {
        if (review === null) {
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
        if (review === null) {
          next();
          return;
        }
        res.json(review);
        winston.info(`Updated review with id ${req.params.review_id}`);
        actionLogger.log('updated a review', req.user, 'review', review._id);
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

router.route('/review').post(function(req, res, next) {
  reviewFactory.getReview(req.body).then(function(newReview) {
    console.log(newReview.toObject());
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
