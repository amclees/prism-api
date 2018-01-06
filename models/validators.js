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
        winston.log('debug', `Finished checking uniqueness on ${modelName} model, returning ${!error && results.length === 0}`);
        done(!error && results.length === 0);
      });
    } else {
      done(true);
    }
  };
};

exports.noSpecialCharacters = function(path, spaces) {
  return function(value) {
    if (this.isNew || this.isModified(path)) {
      if (spaces) {
        return /^[A-Za-z0-9_\-\.& ]+$/.test(value);
      }
      return /^[A-Za-z0-9_\-\.&]+$/.test(value);
    } else {
      return true;
    }
  };
};
