const _ = require('lodash');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const winston = require('winston');

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Document = mongoose.model('Document');
const ExternalUpload = mongoose.model('ExternalUpload');
const User = mongoose.model('User');

const access = require('../lib/access');
const actionLogger = require('../lib/action_logger');
const settings = require('../lib/config/settings');
const subscribeMiddlewareFactory = require('../lib/subscribe_middleware_factory');

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

const allowDocumentGroups = access.allowDatabaseGroups('Document', 'document_id', 'groups');

router.route('/document/:document_id')
    .get(allowDocumentGroups, function(req, res) {
      res.json(req.document.excludeFields());
    })
    .patch(allowDocumentGroups, function(req, res, next) {
      for (let property of _.keys(req.body)) {
        if (property !== 'title' && property !== 'completionEstimate') {
          res.sendStatus(400);
          return;
        }
      }
      const document = req.document;
      if (!document) {
        next();
        return;
      }
      if (document.locked) {
        res.sendStatus(403);
        return;
      }
      _.assign(document, req.body);
      document.save().then(function() {
        res.json(document.excludeFields());
        winston.info(`Updated document with id ${req.params.document_id}`);
        actionLogger.log(`renamed a document to`, req.user, 'document', document._id, document.title);
      }, next);
    });

// POST endpoint here is for testing, the final application will post to a review or event based endpoint
router.route('/document').post(function(req, res, next) {
  Document.create(req.body).then(function(newDocument) {
    res.status(201);
    res.json(newDocument.excludeFields());
    winston.info(`Created document with id ${newDocument._id}`);
    actionLogger.log(`created a new document`, req.user, 'document', newDocument._id, newDocument.title);
  }, function(err) {
    next(err);
    winston.info('Failed to create document with body:', req.body);
  });
});

router.route('/document/:document_id/comment/:comment_id')
    .patch(allowDocumentGroups, function(req, res, next) {
      Document.findById(req.params.document_id).then(function(document) {
        let comments_index = Number.parseInt(req.params.comment_id);
        if (document === null) {
          next();
          return;
        }
        if (isNaN(comments_index)) {
          next();
          winston.info('No comment with specified index.');
          return;
        }
        document.comments[comments_index].text = req.body.text;
        document.save().then(function() {
          res.sendStatus(200);
          winston.info(`Updated comment with id ${req.params.comment_id}`);
        });
      }, function(err) {
        next(err);
        winston.info(`Failed to update comment with id ${req.params.comment_id}.`);
      }, function(err) {
        next(err);
        winston.info(`Failed to find document with id ${req.params.document_id}`);
      });
    })
    .delete(allowDocumentGroups, function(req, res, next) {
      Document.findById(req.params.document_id).then(function(document) {
        let comments_index = Number.parseInt(req.params.comment_id);
        if (document === null) {
          next();
          return;
        }
        if (isNaN(comments_index)) {
          next();
          winston.info(`No comment with that index`);
        }
        document.comments.splice(comments_index, 1);
        document.save().then(function() {
          res.sendStatus(200);
          winston.info(`Deleted comment with id ${req.params.comment_id}`);
          winston.info(comments_index);
        });
      }, function(err) {
        next(err);
        winston.info(`Failed to find comment with id  ${req.params.comment_id} for comment deletion.`);
      }, function(err) {
        next(err);
        winston.info(`Failed to find document with id ${req.params.document_id} for comment deletion.`);
      });
    });

router.route('/document/:document_id/comment').post(allowDocumentGroups, function(req, res, next) {
  Document.findById(req.params.document_id).then(function(document) {
    if (document === null) {
      next();
      return;
    }
    document.comments.push({
      'text': req.body.text,
      'creationDate': Date.now(),
      'author': req.user.excludeFields(),
      'revision': req.body.revision,
      'originalFilename': req.body.originalFilename
    });
    document.save().then(function() {
      winston.info(`Created comment with id ${req.params.comment_id}.`);
      res.sendStatus(200);
    });
  }, function(err) {
    next(err);
    winston.info(`Error creating comment with id ${req.params.comment_id}.`);
  }, function(err) {
    next(err);
    winston.info(`Failed to find document with ${req.params.document_id} for comment upload.`);
  });
});

router.route('/document/:document_id/revision/:revision/file')
    .all(allowDocumentGroups)
    .get(function(req, res, next) {
      const document = req.document;
      if (document === null || !document.validRevision(req.params.revision) || document.revisions[req.params.revision].filename === null) {
        next();
        return;
      }

      const filename = `${document.title}_revision_${Number.parseInt(req.params.revision) + 1}_${document.revisions[req.params.revision].uploader.username}${path.extname(document.revisions[req.params.revision].originalFilename)}`;
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
      const options = {
        root: process.env.FILE_DIR
      };
      res.sendFile(document.revisions[req.params.revision].filename, options);
    })
    .post(function(req, res, next) {
      const document = req.document;
      if (document === null || !document.validRevision(req.params.revision)) {
        next();
        return;
      }
      if (document.locked) {
        res.sendStatus(403);
        return;
      }
      if (document.revisions[req.params.revision].filename !== null) {
        const err = new Error('Revision file must be null for a new file to be uploaded');
        err.status = 400;
        next(err);
        return;
      }
      // if (!document.revisions[req.params.revision].uploader._id.equals(req.user._id)) {
      //   winston.warn(`Non-uploader ${req.user._id} attempted to upload to a revision before the uploader ${document.revisions[req.params.revision].uploader._id}`);
      //   res.sendStatus(403);
      //   return;
      // }
      upload(req, res, function(multerError) {
        if (multerError) {
          next(multerError);
          return;
        }
        document.revisions[req.params.revision].filename = req.file.filename;
        document.revisions[req.params.revision].originalFilename = req.file.originalname;
        document.save().then(function() {
          res.sendStatus(200);
        }, function(err) {
          next(err);
          winston.error('Error saving document after file upload', err);
        });
      });
    });

router.route('/document/:document_id/revision/:revision').delete(allowDocumentGroups, function(req, res, next) {
  const document = req.document;
  if (document.locked) {
    res.sendStatus(403);
    return;
  }
  document.setDeleted(req.params.revision, true).then(function() {
    res.sendStatus(204);
    winston.info(`Deleted revision ${req.params.revision} on document ${req.params.document_id}`);
    actionLogger.log(`deleted revision ${req.params.revision} on document`, req.user, 'document', document._id, document.title);
  }, function(err) {
    next(err);
    winston.info(`Error deleting revision ${req.params.revision} on document ${req.params.document_id}`);
  });
});

router.route('/document/:document_id/revision/:revision/restore').post(access.allowGroups(['Administrators']), function(req, res, next) {
  Document.findById(req.params.document_id).then(function(document) {
    if (document.locked) {
      res.sendStatus(403);
      return;
    }
    document.setDeleted(req.params.revision, undefined).then(function() {
      res.sendStatus(200);
      winston.info(`Restored revision ${req.params.revision} on document ${req.params.document_id}`);
      actionLogger.log(`restored revision ${req.params.revision} on document`, req.user, 'document', document._id, document.title);
    }, function(err) {
      next(err);
      winston.info(`Error restoring revision ${req.params.revision} on document ${req.params.document_id}`);
    });
  }, function(err) {
    next(err);
    winston.info(`Failed to find document with id ${req.params.document_id} for revision restoration`);
  });
});

router.post('/document/:document_id/revision', allowDocumentGroups, function(req, res, next) {
  let revertIndex;
  if (req.body.revert !== undefined) {
    revertIndex = Number.parseInt(req.body.revert);
    if (isNaN(revertIndex)) {
      res.sendStatus(400);
      winston.info('Invalid revert index specified when creating a revert revision (could not parse to integer)');
      return;
    }
  }
  const document = req.document;
  if (document.locked) {
    res.sendStatus(403);
    return;
  }
  try {
    if (revertIndex !== undefined) {
      if (!document.validRevision(revertIndex)) {
        res.sendStatus(400);
        winston.info('Invalid revert index specified when creating a revert revision');
        return;
      }
      document.addRevision(`Revert to revision: '${document.revisions[revertIndex].message}'`, req.user);
      document.revisions[document.revisions.length - 1].filename = document.revisions[revertIndex].filename;
      document.revisions[document.revisions.length - 1].originalFilename = document.revisions[revertIndex].originalFilename;
    } else {
      document.addRevision(req.body.message, req.user);
    }
  } catch (err) {
    winston.error('err', err);
  }
  document.save().then(function() {
    res.sendStatus(201);
    winston.info(`Created revision on document ${req.params.document_id}`);
    actionLogger.log(`created a revision '${document.revisions[document.revisions.length - 1].message}' on document`, req.user, 'document', document._id, document.title);
  }, function(err) {
    next(err);
    winston.info(`Error deleting revision ${req.params.revision} on document ${req.params.document_id}`);
  });
});

router.post('/document/:id/subscribe', subscribeMiddlewareFactory.getSubscribeMiddleware('Document', true));
router.post('/document/:id/unsubscribe', subscribeMiddlewareFactory.getSubscribeMiddleware('Document', false));

router.post('/document/:document_id/external-upload', access.allowGroups(['Administrators']), function(req, res, next) {
  if (!req.body.user) {
    res.sendStatus(400);
    return;
  }
  (new User({
    'username': req.body.user.username,
    'name': req.body.user.name,
    'email': req.body.user.email,
    'groups': [],
    'internal': true,
    'disabled': true
  })).save()
      .then(function(newUser) {
        Document.count({_id: req.params.document_id}).then(function(count) {
          if (count !== 1) {
            next();
            return;
          }
          // The token should be 64 digits hex which is 32 bytes
          crypto.randomBytes(32, function(cryptoErr, buffer) {
            if (cryptoErr) {
              next(cryptoErr);
            }
            const generatedToken = buffer.toString('hex');
            (new ExternalUpload({
              document: req.params.document_id,
              user: newUser._id,
              token: generatedToken
            })).save()
                .then(function(externalUpload) {
                  // Only administrators create external uploads, so it is acceptable for them to receive the token
                  res.json(externalUpload);
                  winston.info(`Created new external upload ${externalUpload._id} with document ${externalUpload.document} and user ${externalUpload.user}`);
                }, function(err) {
                  newUser.remove().then(function() {
                    next(err);
                  }, next);
                });
          });
        }, next);
      }, next);
});

module.exports = router;
