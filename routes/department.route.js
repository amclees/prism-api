const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Department = mongoose.model('Department');

router.route('/department/:department_id')
    .get(function(req, res, next) {
      Department.findById(req.params.department_id).then(function(department) {
        res.json(department);
      }, function(err) {
        err.status = 404;
        next(err);
      });
    })
    .patch(function(req, res, next) {
      Department.findByIdAndUpdate(req.params.department_id, {$set: req.body}, {new: true, runValidators: true}).then(function(updatedDepartment) {
        res.json(updatedDepartment);
        winston.info(`Updated department with id ${req.params.department_id}`);
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Department.findByIdAndRemove(req.params.department_id).then(function(removedDocument) {
        if (removedDocument) {
          res.sendStatus(204);
          winston.info(`Removed department with id ${req.params.department_id}`);
        } else {
          res.sendStatus(404);
          winston.info(`Tried to remove nonexistent department with id ${req.params.department_id}`);
        }
      }, function(err) {
        next(err);
      });
    });

router.route('/department').post(function(req, res, next) {
  Department.create(req.body).then(function(newDepartment) {
    res.status(201);
    res.json(newDepartment);
    winston.info(`Created department with id ${newDepartment._id}`);
  }, function(err) {
    next(err);
    winston.info('Failed to create department with body:', req.body);
  });
});

router.get('/departments', function(req, res, next) {
  Department.find().exec().then(function(departments) {
    res.json(departments);
  }, function(err) {
    next(err);
    winston.error('Error fetching all departments:', err);
  });
});

module.exports = router;
