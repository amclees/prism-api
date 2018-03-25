const winston = require('winston');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();

const Resource = mongoose.model('Resource');
const settings = require('../lib/config/settings');

const access = require('../lib/access');

const allowDocumentGroups = access.allowDatabaseGroups('Resource', 'resource_id', 'groups');
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

    router.route('/resource/:resource_id')
        .get(allowDocumentGroups, function(req, res,next) {
        Resource.findById(req.params.resource_id).then(function(resource){
            res.json(resource);
          }, next);

        });

      router.route('/resource/:resource_id/files/:files/file')
      .get(allowDocumentGroups, function(req, res, next) {
        const resource = req.resource;
        if (resource === null) {
          next();
          return;
        }
        const filename = `${resource.title}_file_${Number.parseInt(req.params.files) + 1}_${resource.files[req.params.files].uploader.username}${path.extname(resource.files[req.params.files].originalFilename)}`;
        res.set('Content-Disposition', `attachment; filename="${filename}"`);
        const options = {
          root: process.env.FILE_DIR
        };
        res.sendFile(resource.files[req.params.files].filename, options);
      })
      .post(access.allowGroups(['Administrators']), function(req, res, next) {
        Resource.findById(req.params.resource_id).then(function(resource){
          upload(req, res, function(multerError) {
            if (multerError) {
              next(multerError);
              return;
            }
            resource.files[req.params.files].filename = req.file.filename;
            resource.files[req.params.files].originalFilename = req.file.originalname;
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

    router.post('/resource/:resource_id/files', allowDocumentGroups, function(req, res, next){
      Resource.findById(req.params.resource_id). then(function(resource){
        if(resource === null){
          next();
          return;
        }
        resource.addFiles(req.body.message, req.user);
        resource.save().then(function() {
          winston.info(`Created files with id `);
          res.sendStatus(200);
        }, function(err) {
          next(err);
          winston.info(`Error creating files.`);
        }, function(err) {
          next(err);
          winston.info(`Failed to find resource with ${req.params.resource_id} for comment upload.`);
        });
      });
    });


    router.route('/resources').get(access.allowGroups(['Administrators']), function(req, res, next) {
        Resource.find({}).exec().then(function(resources){
          res.json(resources);
        }, function(err) {
          next(err);
          winston.error('Error fetching all resources:', err);
        });
      });


    module.exports = router;
