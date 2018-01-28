const winston = require('winston');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();

const Resource = mongoose.model('Resource');
const settings = require('../lib/config/settings');

const upload =
    multer({
      storage: multer.diskStorage({
        destination: process.env.FILE_DIR
      }),
      fileFilter: function(req, file, callback) {
        if (settings.revisionExtensions.includes(path.extname(file.originalname).toLowerCase())) {
          callback(null, true);
        } else {
          callback(new Error('Invalid file extension'));
        }
      },
      limits: {
        fields: 0,
        files: 1,
        fileSize: settings.revisionMaxFileSize
      }
    }).single('file');

    router.route('/resources/resource_id')
    .get(function(req, res, next) {
      Resource.findById(req.params.resource_id).then(function(resource) {
        if(resource === null) {
          next();
          return;
        }
        res.json(resource);
      }, function( err) {
        next(err);
        winston.info(`Failed to find document with id ${req.params.resource_id}`);
      });
    })
    .post(function(req, res, next) {
      Resource.findById(req.params.resource_id).then(function(resource) {
        if (resource === null) {
          next();
          return;
        }
        if (resource.filename !== null) {
          const err = new Error('Resource file must be null for a new file to be uploaded');
          err.status = 400;
          next(err);
          return;
        }
        upload(req, res, function(multerError) {
          if (multerError) {
            next(multerError);
            return;
          }
          resource.filename = req.file.filename;
          resource.fileExtension = path.extname(req.file.originalname).toLowerCase();
          resource.save().then(function() {
            res.sendStatus(200);
          }, function(err) {
            next(err);
            winston.error('Error saving document after file upload', err);
          });
        });
      }, function(err) {
        next(err);
        winston.info(`Failed to find document with id ${req.params.resource_id} for resource file upload`);
      });
    })
    .delete(function(req, res, next) {
      Resource.findByIdAndRemove(req.params.resource_id).then(function(removedResource) {
        if (removedResource) {
          res.sendStatus(204);
          winston.info(`Removed resource with id ${req.params.resource_id}`);
        } else {
          res.sendStatus(404);
          winston.info(`Failed to find and remove resource with id ${req.params.resource_id}`);
        }
      }, function(err) {
        next(err);
      });
    });



    module.exports = router;
