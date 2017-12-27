'use strict';

const _ = require('lodash');

const winston = require('winston');

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validatorModule = require('validator');

const settings = require('../lib/config/settings');
const validators = require('./validators');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: settings.minUsernameLength,
    maxlength: settings.maxUsernameLength
  },
  email: {type: String, required: true},
  name: {
    first: {type: String, required: true},
    last: {type: String, required: true}
  },
  internal: {
    type: Boolean,
    required: [true, 'Missing internal boolean']
  },
  root: {
    type: Boolean,
    default: false
  },
  enabled: { // Flag for 'deleted' account users
    type: Boolean,
    required: true,
    default: true
  },
  samlType: String,
  passwordHash: String
});

userSchema.index({username: 1});

userSchema.path('username').validate({
  validator: validators.unique('User', 'username'),
  isAsync: true,
  message: 'Username must be unique'
});

userSchema.path('username').validate({
  validator: validators.noSpecialCharacters('username'),
  isAsync: false,
  message: 'Invalid characters in username'
});

userSchema.path('email').validate({
  validator: validatorModule.isEmail,
  isAsync: false,
  message: 'Email must be a valid email'
});

userSchema.methods = {
  setPassword: function(passwordPlaintext) {
    return bcrypt.hash(passwordPlaintext, settings.saltRounds).then((passwordHash) => {
      this.passwordHash = passwordHash;
      return passwordHash;
    }, (error) => {
      winston.log('error', 'Failed to hash password plaintext', {
        'uid': this._id,
        'passwordPlaintext': passwordPlaintext,
        'error': error.message
      });
    });
  },
  comparePassword: function(passwordPlaintext) {
    return bcrypt.compare(passwordPlaintext, this.passwordHash);
  },
  excludeFields: function(fields = ['passwordHash']) {
    return _.omit(this.toObject(), fields);
  }
};

module.exports = mongoose.model('User', userSchema);
