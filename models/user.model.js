'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const settings = require('../config/settings.js');

const requiredString = error => {
  return {type: String, required: [true, error]};
};

const userSchema = new mongoose.Schema({
  username: requiredString('Missing username'),
  email: requiredString('Missing email'),
  name: {
    first: requiredString('Missing first name'),
    last: requiredString('Missing last name')
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
    });
  },
  comparePassword: function(passwordPlaintext) {
    return bcrypt.compare(passwordPlaintext, this.passwordHash).then((same) => {
      return same;
    });
  }
};

userSchema.statics = {

};

module.exports = mongoose.model('User', userSchema);
