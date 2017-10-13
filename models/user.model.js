'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const settings = require('../config/settings.js');

const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
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
  cas: {},
  passwordHash: String
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
  }
};

userSchema.statics = {

};

module.exports = mongoose.model('User', userSchema);
