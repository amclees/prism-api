'use strict';

const mongoose = require('mongoose');

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
  internal: {type: Boolean, required: [true, 'Missing internal boolean']},
  cas: {},
  password_hash: String,
  salt: String
});

userSchema.methods = {

};

userSchema.statics = {

};

module.exports = mongoose.model('User', userSchema);
