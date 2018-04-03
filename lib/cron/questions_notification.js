const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const Review = mongoose.model('Review');
const _ = require('lodash');

const CronJob = require('cron').CronJob;

const job = new CronJob({
  cronTime: '* 30 08 * * *',
  onTick: function() {
  Review.find({}, (err,reviews) => {
    if(err) {
      console.log("error");
    }
    reviews.forEach(function(review) {
      for (let node of _.values(review.nodes)) {
        if (node.title === 'Questions' && node.completionEstimate === 3){
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
              transporter.use('compile', hbs ({
                  viewPath: 'templates',
                  extName: '.hbs'
              }));

              const memberArray = ['Justin', 'Andrew', 'Ben'];
              let message = {
                  from: 'allen3just@yahoo.com',
                  to: 'example@example.com',
                  subject: 'Notification email',
                  template: '../lib/templates/document_deadline_notification',
                  context: {
                    Member: memberArray
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

        };
      };
    });
  });
  },
  start: true,
  timeZone: 'America/Los_Angeles'
});




// module.exports = job();
