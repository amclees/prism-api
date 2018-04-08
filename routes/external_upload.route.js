const multer = require('multer');
const path = require('path');
const winston = require('winston');

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Document = mongoose.model('Document');
const ExternalUpload = mongoose.model('ExternalUpload');

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
        fileSize: settings.revisionExternalMaxFileSize
      }
    }).single('file');

router.route('/external-upload/:token')
    .get(function(req, res, next) {
      ExternalUpload.findOne({token: req.params.token}).populate('user').populate('document').then(function(externalUpload) {
        if (externalUpload === null) {
          next();
          return;
        }
        res.json(externalUpload);
      }, next);
    })
    .post(function(req, res, next) {
      ExternalUpload.findOne({token: req.params.token}).populate('user').then(function(externalUpload) {
        if (externalUpload === null) {
          next();
          return;
        }
        if (externalUpload.completed) {
          res.sendStatus(400);
          return;
        }
        Document.findById(externalUpload.document).then(function(document) {
          if (document === null) {
            winston.error('Document null in ExternalUpload', externalUpload._id);
            res.sendStatus(500);
            return;
          }
          upload(req, res, function(multerError) {
            if (multerError) {
              next(multerError);
              return;
            }
            winston.info(req.file.filename, req.file.originalname);
            document.addRevision('Upload external report', externalUpload.user);
            document.revisions[0].filename = req.file.filename;
            document.revisions[0].originalFilename = req.file.originalname;
            document.save().then(function() {
              externalUpload.completed = true;
              externalUpload.save().then(function() {
                res.sendStatus(200);
              }, next);
            }, function(err) {
              next(err);
              winston.error('Error saving document after file upload', err);
            });
          });
        });
      });
    });

module.exports = router;
