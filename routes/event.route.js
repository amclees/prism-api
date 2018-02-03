const winston = require('winston');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Event = mongoose.model('Event');

const access = require('../lib/access');
const actionLogger = require('../lib/action_logger');
const subscribeMiddlewareFactory = require('../lib/subscribe_middleware_factory');

router.route('/event/:event_id')
    .all(access.allowGroups(['Administrators']))
    .get(function(req, res, next) {
      Event.findById(req.params.event_id).populate('documents').then(function(event) {
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
          if (['title', 'date', 'groups', 'people', 'notifications'].indexOf(property) === -1) {
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
        event.save().then((savedEvent) => {
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
      Event.findByIdAndRemove(req.params.event_id).then(function(removedEvent) {
        if (removedEvent) {
          res.sendStatus(204);
          winston.info(`Removed event with id ${req.params.event_id}`);
          actionLogger.log(`deleted the event ${removedEvent.title}`, req.user, 'event', removedEvent._id);
        } else {
          res.sendStatus(404);
          winston.info(`Tried to remove nonexistent event with id ${req.params.event_id}`);
        }
      }, function(err) {
        next(err);
      });
    });

router.route('/event').post(access.allowGroups(['Administrators']), function(req, res, next) {
  Event.create({
         'title': req.body.title,
         'date': req.body.date
       })
      .then(function(newEvent) {
        res.status(201);
        res.json(newEvent);
        winston.info(`Created event with id ${newEvent._id}`);
        actionLogger.log(`created the event "${newEvent.title}"`, req.user, 'event', newEvent._id);
      }, function(err) {
        next(err);
        winston.info('Failed to create event with body:', req.body);
      });
});

router.post('/event/:event_id/cancel', access.allowGroups(['Administrators']), function(req, res, next) {
  Event.findById(req.params.event_id).then(function(event) {
    if (event.canceled) {
      res.sendStatus(405);
      return;
    }
    event.cancel();
    res.sendStatus(200);
    winston.info(`Cancelled event with id ${req.params.event_id}`);
    actionLogger.log(`cancelled the event ${event.title}`, req.user, 'event', event._id);
  }, function(err) {
    next(err);
  });
});

router.post('/event/:event_id/document', access.allowGroups(['Administrators']), function(req, res, next) {
  Event.findById(req.params.event_id).then(function(event) {
    event.addDocument(req.body.title).then(function(createdDocument) {
      res.json(createdDocument.excludeFields());
      winston.info(`Created document ${createdDocument._id} on event with id ${req.params.event_id}`);
      actionLogger.log(`created the document '${req.body.title}' on the event ${event.title}`, req.user, 'event', event._id);
    }, function(err) {
      next(err);
    });
  }, function(err) {
    next(err);
  });
});

router.delete('/event/:event_id/document/:document', access.allowGroups(['Administrators']), function(req, res, next) {
  Event.findById(req.params.event_id).populate('documents').then(function(event) {
    event.deleteDocument(req.params.document).then(function(removedDocument) {
      res.sendStatus(204);
      winston.info(`Deleted document ${req.params.document} from event with id ${req.params.event_id}`);
      actionLogger.log(`deleted the document '${removedDocument.title}' on the event ${event.title}`, req.user, 'event', event._id);
    }, function(err) {
      next(err);
    });
  }, function(err) {
    next(err);
  });
});

router.get('/events', access.allowGroups(['Administrators']), function(req, res, next) {
  Event.find().exec().then(function(events) {
    res.json(events);
  }, function(err) {
    next(err);
    winston.error('Error fetching all events:', err);
  });
});

router.post('/event/:id/subscribe', subscribeMiddlewareFactory.getSubscribeMiddleware('Event', true));
router.post('/event/:id/unsubscribe', subscribeMiddlewareFactory.getSubscribeMiddleware('Event', false));

module.exports = router;
