const winston = require('winston');

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Document = mongoose.model('Document');

const access = require('../lib/access');
const actionLogger = require('../lib/action_logger');

router.post('/template', access.allowGroups(['Administrators']), function(req, res, next) {
  if (req.body.completionEstimate === undefined || req.body.completionEstimate === null) {
    res.sendStatus(400);
    return;
  }
  Document.create({
            title: req.body.title,
            template: true,
            completionEstimate: req.body.completionEstimate
          })
      .then(function(newDocument) {
        res.status(201);
        res.json(newDocument.excludeFields());
        winston.info(`Created template with id ${newDocument._id}`);
        actionLogger.log(`created a new template`, req.user, 'document', newDocument._id, newDocument.title);
      }, function(err) {
        next(err);
        winston.info('Failed to create document with body:', req.body);
      });
});

router.delete('/template/:template_id', access.allowGroups(['Administrators']), function(req, res, next) {
  Document.findById(req.params.template_id).then(function(toRemove) {
    if (toRemove === null) {
      res.sendStatus(404);
      return;
    }
    if (!toRemove.template || toRemove.coreTemplate) {
      res.sendStatus(400);
      return;
    }
    toRemove.remove().then(function() {
      res.sendStatus(204);
    }, next);
  }, next);
});

router.get('/templates', access.allowGroups(['Administrators']), function(req, res, next) {
  Document.find({template: true}).exec().then(function(templates) {
    const excludedTemplates = [];
    for (let template of templates) {
      excludedTemplates.push(template.excludeFields());
    }
    res.json(excludedTemplates);
  }, function(err) {
    next(err);
    winston.error('Error fetching all templates:', err);
  });
});

module.exports = router;
