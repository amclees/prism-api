const winston = require('winston');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Event = mongoose.model('Document');

const access = require('../lib/access');
const actionLogger = require('../lib/action_logger');

router.route('/event/:event_id')
    .all(access.allowEvents(['Administrators']))
    .get(function(req, res, next) {
      Event.findById(req.params.event_id).then(function(event) {
        if (event === null) {
          next();
          return;
        }
        res.json(event);
      }, function(err) {
        next(err);
      });
    })
    .patch(function(req, res, next) {
      Event.findById(req.params.event_id).then(function(event) {
        if (event === null) {
          next();
          return;
        }
        for (let property of _.keys(req.body)) {
          if (['title', 'date', 'canceled', 'groups', 'people', 'notifications'].indexOf(property) === -1) {
            res.sendStatus(400);
            return;
          } else {
            if (property === 'date') {
              event.changeDate(req.body.date);
            } else {
              event[property] = req.body[property];
            }
          }
        }
        event.save((savedEvent) => {
          res.json(savedEvent);
          winston.info(`Updated event with id ${req.params.event_id}`);
          actionLogger.log(`updated ${savedEvent.title}`, req.user, 'event', event._id);
        }, (err) => {
          next(err);
        });
      }, function(err) {
        next(err);
      });
    })
    .delete(function(req, res, next) {
      Event.findByIdAndRemove(req.params.event_id).then(function(removedDocument) {
        if (removedDocument) {
          res.sendStatus(204);
          winston.info(`Removed event with id ${req.params.event_id}`);
        } else {
          res.sendStatus(404);
          winston.info(`Tried to remove nonexistent event with id ${req.params.event_id}`);
        }
      }, function(err) {
        next(err);
      });
    });

router.route('/event').post(access.allowEvents(['Administrators']), function(req, res, next) {
  Event.create(req.body).then(function(newEvent) {
    res.status(201);
    res.json(newEvent);
    winston.info(`Created event with id ${newEvent._id}`);
    actionLogger.log(`created the event "${newEvent.name}"`, req.user, 'event', newEvent._id);
  }, function(err) {
    next(err);
    winston.info('Failed to create event with body:', req.body);
  });
});

router.get('/events', access.allowEvents(['Administrators']), function(req, res, next) {
  Event.find().exec().then(function(events) {
    res.json(events);
  }, function(err) {
    next(err);
    winston.error('Error fetching all events:', err);
  });
});

module.exports = router;
