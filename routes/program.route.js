const winston = require('winston');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Program = mongoose.model('Program');
const Review = mongoose.model('Review');

router.route('/program/:program_id')
    .get(function(req, res, next) {
      Program.findById(req.params.program_id).then(function(program) {
        if (program === null) {
          next();
          return;
        }
        res.json(program);
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      Program.findByIdAndUpdate(req.params.program_id, {$set: req.body}, {new: true, runValidators: true}).then(function(updatedProgram) {
        if (updatedProgram === null) {
          next();
          return;
        }
        res.json(updatedProgram);
        winston.info(`Updated program with id ${req.params.program_id}`);
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Review.find({program: req.params.program_id}).then(function(dependents) {
        if (dependents.length === 0) {
          Program.findByIdAndRemove(req.params.program_id).then(function(removedDocument) {
            if (removedDocument) {
              res.sendStatus(204);
              winston.info(`Removed program with id ${req.params.program_id}`);
            } else {
              res.sendStatus(404);
              winston.info(`Tried to remove nonexistent program with id ${req.params.program_id}`);
            }
          }, function(err) {
            next(err);
          });
        } else {
          res.sendStatus(400);
          winston.info(`Tried to remove program with id ${req.params.program_id} but it had dependents`);
        }
      }, function(err) {
        next(err);
      });
    });

router.route('/program').post(function(req, res, next) {
  Program.create(req.body).then(function(newProgram) {
    res.status(201);
    res.json(newProgram);
    winston.info(`Created program with id ${newProgram._id}`);
  }, function(err) {
    next(err);
    winston.info('Failed to create program with body:', req.body);
  });
});

router.get('/programs', function(req, res, next) {
  Program.find().exec().then(function(programs) {
    res.json(programs);
  }, function(err) {
    next(err);
    winston.error('Error fetching all programs:', err);
  });
});

module.exports = router;
