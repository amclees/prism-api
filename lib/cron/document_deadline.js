const winston = require('winston');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const Review = mongoose.model('Review');
const Document = mongoose.model('Document');
const User = mongoose.model('User');
const _ = require('lodash');

const CronJob = require('cron').CronJob;

const deadlineJob = new CronJob({
  cronTime: '* 30 08 * * *',
  onTick: function() {
    Review.find({}, (err, reviews) => {
      if (err) {
        console.log('error');
      }
      reviews.forEach(function(review) {
        for (let node of _.values(review.nodes)) {
          let currentDate = Date.now();
          let documentDate = node.finishDate.getTime();
          let daysRemaining = Math.floor((documentDate - currentDate) / 86400000);
          if (daysRemaining === 1) {
            Document.findById(node.document).then(function(document) {
              for (let id of document.subscribers) {
                User.findById(id).then(function(user) {
                  nodemailer.createTestAccount((err, account) => {
                    if (err) {
                      console.error('Failed to create a testing account. ' + err.message);
                      return process.exit(1);
                    }

                    console.log('Credentials obtained, sending message...');

                    // Create a SMTP transporter object
                    let transporter = nodemailer.createTransport({
                      host: account.smtp.host,
                      port: account.smtp.port,
                      secure: account.smtp.secure,
                      auth: {
                        user: account.user,
                        pass: account.pass
                      }
                    });
                    transporter.use('compile', hbs({
                                      viewPath: 'templates',
                                      extName: '.hbs'
                                    }));

                    let message = {
                      from: 'allen3just@yahoo.com',
                      to: user.email,
                      subject: 'Notification email',
                      template: '../lib/templates/document_deadline_notification',
                      context: {
                        doc: document.title,
                        member: user.name
                      }
                    };

                    transporter.sendMail(message, (err, info) => {
                      if (err) {
                        console.log('Error occurred. ' + err.message);
                        return process.exit(1);
                      }

                      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                    });
                  });
                });
              }
            }, winston.error);
          }
        }
      });
    });
  },
  start: true,
  timeZone: 'America/Los_Angeles'
});



module.exports = deadlineJob;
