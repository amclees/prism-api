const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Department = mongoose.model('Department');
const Program = mongoose.model('Program');

router.route('/department/:department_id')
    .get(function(req, res, next) {
      Department.findById(req.params.department_id).populate('chairs').then(function(department) {
        if (department === null) {
          next();
          return;
        }
        res.json(department);
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      Department.findByIdAndUpdate(req.params.department_id, {$set: req.body}, {new: true, runValidators: true}).then(function(updatedDepartment) {
        if (updatedDepartment === null) {
          next();
          return;
        }
        res.json(updatedDepartment);
        winston.info(`Updated department with id ${req.params.department_id}`);
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Program.find({department: req.params.department_id}).then(function(dependents) {
        if (dependents.length === 0) {
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
        } else {
          res.sendStatus(400);
          winston.info(`Tried to remove department with id ${req.params.department_id} but it had dependents`);
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

router.route('/department/:department_id/programs')
    .get(function(req, res, next) {
      Program.find({department: req.params.department_id}).then(function(programs) {
        res.json(programs);
      }, function(err) {
        next(err);
      });
    });

router.get('/departments', function(req, res, next) {
  Department.find().populate('chairs').exec().then(function(departments) {
    res.json(departments);
  }, function(err) {
    next(err);
    winston.error('Error fetching all departments:', err);
  });
});

module.exports = router;
