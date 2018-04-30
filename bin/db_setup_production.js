global.Promise = require('bluebird');

const { spawn } = require('child_process');
require('dotenv').config();
const mongoose = require('mongoose');

const _ = require('lodash');

module.exports = function() {
  return new Promise(function(resolve, reject) {
    const db = require('../db');
    db.init([]);

    const rootPassword = require('crypto').randomBytes(8).toString('hex');

    Promise.all(mongoose.modelNames().map(modelName => mongoose.model(modelName).remove({}))).then(function() {
      const userFactory = require('../lib/user_factory');

      createCoreTemplates().then(function() {
        createGroups(['Administrators', 'Program Review Subcommittee', 'University']).then(function() {

          userFactory.getUser({
                       username: 'root',
                       password: rootPassword,
                       email: 'root@prism.calstatela.edu',
                       name: {
                         first: 'Root',
                         last: 'User'
                       },
                       internal: true,
                       root: true
                     })
              .then(function() {
                addPrograms().then(() => {
                  resolve(rootPassword);
                }, reject);
              }, reject);
        }, reject);
      }, reject);
    }, reject);
  });
};

if (!module.parent) {
  module.exports().then(function(rootPassword) {
    console.log('Successfully set up production db. Root password is ' + rootPassword);
    process.exit(0);
  }, function(err) {
    console.log('Error setting up production db');
    console.log(err);
    process.exit(1);
  });
}

function addPrograms() {
  return new Promise(function(resolve) {
    spawn('node', ['./bin/create_university_hierarchy.js']).on('exit', () => {
      resolve();
    });
  });
}

function createGroups(groups) {
  const Group = mongoose.model('Group');
  return Promise.all(groups.map(group => (new Group({
                                           name: group,
                                           access: true
                                         })).save()));
}

const coreTemplates = require('../lib/base_review').templates;

function createCoreTemplates() {
  const Document = mongoose.model('Document');

  return Promise.all(coreTemplates.map(function(template) {
    return (new Document(_.assign({
             'template': true,
             'coreTemplate': true
           },
                                  template)))
        .save();
  }));
}
