const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const College = mongoose.model('College');

router.route('/college/:college_id')
    .get(function(req, res, next) {
      College.findById(req.params.college_id).then(function(college) {
        res.json(college);
      }, function(err) {
        err.status = 404;
        next(err);
      });
    })
    .patch(function(req, res, next) {
      College.findByIdAndUpdate(req.params.college_id, {$set: req.body}, {new: true, runValidators: true}).then(function(updatedCollege) {
        res.json(updatedCollege);
        winston.info(`Updated college with id ${req.params.college_id}`);
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      College.findByIdAndRemove(req.params.college_id).then(function(removedDocument) {
        if (removedDocument) {
          res.sendStatus(204);
          winston.info(`Removed college with id ${req.params.college_id}`);
        } else {
          res.sendStatus(404);
          winston.info(`Tried to remove nonexistent college with id ${req.params.college_id}`);
        }
      }, function(err) {
        next(err);
      });
    });

router.route('/college').post(function(req, res, next) {
  College.create(req.body).then(function(newCollege) {
    res.status(201);
    res.json(newCollege);
    winston.info(`Created college with id ${newCollege._id}`);
  }, function(err) {
    next(err);
    winston.info('Failed to create college with body:', req.body);
  });
});

router.get('/colleges', function(req, res, next) {
  College.find().exec().then(function(colleges) {
    res.json(colleges);
  }, function(err) {
    next(err);
    winston.error('Error fetching all colleges:', err);
  });
});

module.exports = router;
