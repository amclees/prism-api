const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const College = mongoose.model('College');
const Department = mongoose.model('Department');

router.route('/college/:college_id')
    .get(function(req, res, next) {
      College.findById(req.params.college_id).populate('deans').then(function(college) {
        if (college === null) {
          next();
          return;
        }
        res.json(college);
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      College.findByIdAndUpdate(req.params.college_id, {$set: req.body}, {new: true, runValidators: true}).then(function(updatedCollege) {
        if (updatedCollege === null) {
          next();
          return;
        }
        res.json(updatedCollege);
        winston.info(`Updated college with id ${req.params.college_id}`);
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Department.find({college: req.params.college_id}).then(function(dependents) {
        if (dependents.length === 0) {
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
        } else {
          res.sendStatus(400);
          winston.info(`Tried to remove college with id ${req.params.college_id} but it had dependents`);
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

router.route('/college/:college_id/departments')
    .get(function(req, res, next) {
      Department.find({college: req.params.college_id}).populate('chairs').then(function(departments) {
        res.json(departments);
      }, function(err) {
        next(err);
      });
    });

router.get('/colleges', function(req, res, next) {
  College.find().populate('deans').exec().then(function(colleges) {
    res.json(colleges);
  }, function(err) {
    next(err);
    winston.error('Error fetching all colleges:', err);
  });
});

module.exports = router;
