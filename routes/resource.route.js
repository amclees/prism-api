const winston = require('winston');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();

const Resource = mongoose.model('Resource');
const settings = require('../lib/config/settings');

const access = require('../lib/access');

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

    router.route('/resource/:resource_id')
    .delete(access.allowGroups(['Administrators']), function(req, res, next) {
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

    //test resource
        router.route('/resource').post(function(req, res, next) {
          Resource.create({title: req.body.title, uploader: req.user}).then(function(newResource) {
            res.json(newResource);
            winston.info(`Created resource with id ${newResource._id}`);
          }, function(err) {
            next(err);
            winston.info('Failed to create document with body:', req.body);
          });
        });

      router.route('/resource/:resource_id/file').post(access.allowGroups(['Administrators']), function(req, res, next) {
        Resource.findById(req.params.resource_id).then(function(resource){
          upload(req, res, function(multerError) {
            if (multerError) {
              next(multerError);
              return;
            }
            resource.title = req.file.filename;
            resource.save().then(function() {
              winston.info(`Successfully uploaded file.`);
              res.sendStatus(200);
            });
          }, function(err){
            next(err);
            winston.info(`Failed to upload file with resource id ${req.params.resource_id}`);
          });
        });
      });


    router.route('/resource').get(access.allowGroups(['Administrators']), function(req, res, next) {
        Resource.find({}).exec().then(function(resources){
          res.json(resources);
        }, function(err) {
          next(err);
          winston.error('Error fetching all resources:', err);
        });
      });


    module.exports = router;
