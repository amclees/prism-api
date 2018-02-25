const _ = require('lodash');
const mongoose = require('mongoose');

let groupNameToId = {};

const reject = function(err) {
  console.log('Error setting up development db:');
  console.log(err);
  process.exit(1);
};

require('./db_setup_production')().then(function() {
  const userFactory = require('../lib/user_factory');
  const Group = mongoose.model('Group');

  Group.find({}).then(function(groups) {
    for (let group of groups) {
      groupNameToId[group.name] = group._id;
    }

    let users = getUsersForCreation();

    userFactory.getUsers(users).then(function() {
      console.log('Successfully set up development db');
      process.exit(0);
    });
  }, reject);
}, reject);

function getUsersForCreation() {
  let userTemplates = [{
                         username: 'testUser',
                         password: 'password',
                         email: 'email@example.com',
                         name: {
                           first: 'first name',
                           last: 'last name'
                         },
                         internal: true
                       },
                       {
                         username: 'testPrs',
                         password: 'password',
                         email: 'email@example.com',
                         name: {
                           first: 'first name',
                           last: 'last name'
                         },
                         groups: getGroupIds(['Program Review Subcommittee']),
                         internal: true,
                       },
                       {
                         username: 'testAdmin',
                         password: 'password',
                         email: 'email@example.com',
                         name: {
                           first: 'first name',
                           last: 'last name'
                         },
                         groups: getGroupIds(['Administrators']),
                         internal: true
                       },
                       {
                         username: 'testRoot',
                         password: 'password',
                         email: 'email@example.com',
                         name: {
                           first: 'first name',
                           last: 'last name'
                         },
                         internal: true,
                         root: true
                       }];

  let users = [];
  for (let userTemplate of userTemplates) {
    for (let i = 1; i <= 15; i++) {
      let toPush = _.clone(userTemplate);
      toPush.username += i;
      users.push(toPush);
    }
  }
  return users;
}

function getGroupIds(groups) {
  return groups.map(group => groupNameToId[group]);
}
