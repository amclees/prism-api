const mongoose = require('mongoose');
const winston = require('winston');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const Review = mongoose.model('Review');
const Document = mongoose.model('Document');
const User = mongoose.model('User');
const _ = require('lodash');


const CronJob = require('cron').CronJob;

const job = new CronJob({
  cronTime: '5,10,15,20,25,30,35,40,45,50,55,59 * * * * *',
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
            console.log(node.title);
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
                        first: user.name.first,
                        last: user.name.last,
                        document: node.title

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
                }, winston.error);
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



module.exports = job;
