const winston = require('winston');
const mongoose = require('mongoose');

require('./models');

if (!process.env.DB_HOST) {
  winston.warn('DB_HOST not specified in environment. Is the .env file properly set up?');
}

mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {
          useMongoClient: true
        })
    .then(() => {
      winston.info(`Mongoose initial connection to ${process.env.DB_HOST} successful`);
    }, () => {
      winston.error('Mongoose initial connection error');
    });

mongoose.connection.on('connected', () => {
  winston.info(`Mongoose connected to ${process.env.DB_HOST}`);
});

mongoose.connection.on('error', err => {
  winston.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  winston.warn('Mongoose disconnected (likely MongoDB server restarting)');
});

module.exports.disconnect = (msg, callback) => {
  mongoose.connection.close().then(() => {
    winston.info(`Mongoose disconnected: ${msg}`);
    callback();
  }, (err) => {
    winston.error('Mongoose failed to disconnect with error:', err);
  });
};
