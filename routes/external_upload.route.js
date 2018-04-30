const multer = require('multer');
const path = require('path');
const winston = require('winston');

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Document = mongoose.model('Document');
const ExternalUpload = mongoose.model('ExternalUpload');

const access = require('../lib/access');
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
    .get(access.allowGroups(['Administrators', 'Program Review Subcommittee']), function(req, res, next) {
      ExternalUpload.findOne({token: req.params.token}).populate('user').populate('document').then(function(externalUpload) {
        if (externalUpload === null) {
          next();
          return;
        }
        res.json(externalUpload);
      }, next);
    })
    .post(access.allowGroups(['Administrators', 'Program Review Subcommittee']), function(req, res, next) {
      ExternalUpload.findOne({token: req.params.token}).populate('user').then(function(externalUpload) {
        if (externalUpload === null) {
          next();
          return;
        }
        if (externalUpload.completed || externalUpload.disabled) {
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

router.post('/external-upload/:token/cancel', access.allowGroups(['Administrators', 'Program Review Subcommittee']), function(req, res, next) {
  ExternalUpload.findOneAndUpdate({token: req.params.token}, {$set: {disabled: true}}, {new: true}).then(function(externalUpload) {
    if (externalUpload === null) {
      next();
      return;
    }
    res.json(externalUpload);
  }, next);
});

module.exports = router;
