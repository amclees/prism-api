'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const User = require('../models/user.model');

let completed = 0;
let toComplete = 15;

for (let i = 1; i <= toComplete; i++) {
  const userData = {
    username: 'testUser' + i,
    email: 'email@example.com',
    name: {
      first: 'first name',
      last: 'last name'
    },
    internal: true,
    root: false
  };

  User.remove({username: userData.username}, (err) => {
    const user = new User(userData);
    user.setPassword('password').then(() => {
      user.save((error) => {
        completed++;
      });
    });
  });
}

setInterval(() => {
  if (completed === toComplete) {
    console.log('Successfully added users');
    process.exit(0);
  }
}, 100);
