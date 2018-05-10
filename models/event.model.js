'use strict';

const mongoose = require('mongoose');

const Document = mongoose.model('Document');

const Group = mongoose.model('Group');

const User = mongoose.model('User');


const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  canceled: {
    type: Boolean,
    default: false
  },
  sendNotifications: {
    type: Boolean,
    default: true
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
},
                                        {usePushEach: true});

eventSchema.methods.addDocument = function(title) {
  return new Promise((resolve, reject) => {
    Document.create({
              'title': title,
              'groups': ['Administrators', 'Program Review Subcommittee']
            })
        .then((createdDocument) => {
          this.documents.push(createdDocument._id);
          this.save().then(() => {
            resolve(createdDocument);
          }, reject);
        }, reject);
  });
};

eventSchema.methods.deleteDocument = function(document) {
  return new Promise((resolve, reject) => {
    const index = Number.parseInt(document);
    if (isNaN(index) || index < 0 || index >= this.documents.length) {
      reject(new Error('Invalid index to delete'));
      return;
    }
    this.documents[index].delete().then((deletedDocument) => {
      const mongoKey = 'documents.' + index;
      const mongoIndex = {};
      mongoIndex[mongoKey] = null;
      mongoose.model('Event').findByIdAndUpdate(this._id, {$set: mongoIndex}).then(function() {
        resolve(deletedDocument);
      }, reject);
    }, function(err) {
      reject(err);
    });
  });
};

eventSchema.methods.changeDate = function(newDate, sendNotifications = true) {
  this.date = newDate;
  if (sendNotifications && this.sendNotifications) {
    for (let id of this.people) {
      User.findById(id).then(function(user) {
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'prismtestserver@gmail.com',
            pass: 'Answer30'
          }
        });
        transporter.use('compile', hbs({
                          viewPath: 'templates',
                          extName: '.hbs'
                        }));

        let message = {
          from: 'prismtestserver@gmail.com',
          to: 'allen3just@yahoo.com',
          subject: 'Notification email',
          template: '../lib/templates/event_change_date',
          context: {
            first: user.name.first,
            last: user.name.last,
            title: this.title
          }
        };

        transporter.sendMail(message, (err, info) => {
          if (err) {
            console.log('Error occurred. ' + err.message);
            return process.exit(1);
          }
        });
      });
    }
    for (let groupid of this.groups) {
      Group.findById(groupid).then(function(group) {
        for (let id of group.members) {
          User.findById(id).then(function(user) {
            let transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'prismtestserver@gmail.com',
                pass: 'Answer30'
              }
            });
            transporter.use('compile', hbs({
                              viewPath: 'templates',
                              extName: '.hbs'
                            }));

            let message = {
              from: 'prismtestserver@gmail.com',
              to: 'allen3just@yahoo.com',
              subject: 'Notification email',
              template: '../lib/templates/event_change_date',
              context: {
                first: user.name.first,
                last: user.name.last,
                title: this.title
              }
            };

            transporter.sendMail(message, (err, info) => {
              if (err) {
                console.log('Error occurred. ' + err.message);
                return process.exit(1);
              }

            });

          });
        }
      });
    }
  }
};

eventSchema.methods.cancel = function() {
  this.canceled = true;
  if (this.sendNotifications) {
    for (let id of this.people) {
      User.findById(id).then(function(user) {


        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'prismtestserver@gmail.com',
            pass: 'Answer30'
          }
        });
        transporter.use('compile', hbs({
                          viewPath: 'templates',
                          extName: '.hbs'
                        }));

        let message = {
          from: 'prismtestserver@gmail.com',
          to: 'allen3just@yahoo.com',
          subject: 'Notification email',
          template: '../lib/templates/event_cancel',
          context: {
            first: user.name.first,
            last: user.name.last,
            title: this.title
          }
        };

        transporter.sendMail(message, (err, info) => {
          if (err) {
            console.log('Error occurred. ' + err.message);
            return process.exit(1);
          }
        });
      });
    }
    for (let groupid of this.groups) {
      Group.findById(groupid).then(function(group) {
        for (let id of group.members) {
          User.findById(id).then(function(user) {

            let transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'prismtestserver@gmail.com',
                pass: 'Answer30'
              }
            });
            transporter.use('compile', hbs({
                              viewPath: 'templates',
                              extName: '.hbs'
                            }));

            let message = {
              from: 'prismtestserver@gmail.com',
              to: 'allen3just@yahoo.com',
              subject: 'Notification email',
              template: '../lib/templates/event_cancel',
              context: {
                first: user.name.first,
                last: user.name.last,
                title: this.title
              }
            };

            transporter.sendMail(message, (err, info) => {
              if (err) {
                console.log('Error occurred. ' + err.message);
                return process.exit(1);
              }
            });
          });
        }
      });
    }
  }
};

module.exports = mongoose.model('Event', eventSchema);
