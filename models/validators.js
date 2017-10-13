'use strict';

const winston = require('winston');
const mongoose = require('mongoose');

exports.unique = function(modelName, path) {
  return function(value, done) {
    if (this.isNew || this.isModified(path)) {
      const model = mongoose.model(modelName);
      const query = {};
      query[path] = value;
      model.find(query).exec(function(error, results) {
        if (error) {
          winston.log('error', `Error querying to check uniqueness of ${modelName} model: ${error}`);
        }
        winston.log('debug', `Finished checking uniqueness on user, returning ${!error && results.length === 0}`);
        done(!error && results.length === 0);
      });
    } else {
      done(true);
    }
  };
};
