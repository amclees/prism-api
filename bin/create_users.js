'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const User = require('../models/user.model');
const Group = require('../models/group.model');

let completed = 0;
let toComplete = 60;

function createUsers(userData, count, group) {
  for (let i = 1; i <= count; i++) {
    /*eslint-disable no-loop-func */
    User.find({username: userData.username + i}).remove((err) => {
      const user = new User(userData);
      user.username += i;
      user.setPassword('password').then(() => {
        user.save((err, savedUser) => {
          if (group !== undefined) {
            Group.findOne({name: group}, (err, foundGroup) => {
              foundGroup.members.push(user._id);
              foundGroup.save((err, changedGroup) => {
                completed++;
              });
            });
          } else {
            completed++;
          }
        });
      });
    });
    /*eslint-enable no-loop-func */
  }
}

async function createGroups() {
  for (let groupName of ['Administrators', 'Program Review Subcommittee']) {
    const group = new Group({
      name: groupName,
      access: true
    });
    await group.save();
  }
}

Group.find().remove(function() {
  createGroups().then(function() {
    createUsers({
      username: 'testRoot',
      email: 'email@example.com',
      name: {
        first: 'first name',
        last: 'last name'
      },
      internal: true,
      root: true
    },
                15);

    createUsers({
      username: 'testPrs',
      email: 'email@example.com',
      name: {
        first: 'first name',
        last: 'last name'
      },
      internal: true,
    },
                15, 'Program Review Subcommittee');

    createUsers({
      username: 'testAdmin',
      email: 'email@example.com',
      name: {
        first: 'first name',
        last: 'last name'
      },
      internal: true
    },
                15, 'Administrators');

    createUsers({
      username: 'testUser',
      email: 'email@example.com',
      name: {
        first: 'first name',
        last: 'last name'
      },
      internal: true
    },
                15);
  });
});

setInterval(() => {
  if (completed === toComplete) {
    console.log('Successfully added users');
    process.exit(0);
  }
}, 100);
