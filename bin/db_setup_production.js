global.Promise = require('bluebird');

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
        createGroups(['Administrators', 'Program Review Subcommittee']).then(function() {

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
                resolve(rootPassword);
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

function createGroups(groups) {
  const Group = mongoose.model('Group');
  return Promise.all(groups.map(group => (new Group({
                                           name: group,
                                           access: true
                                         })).save()));
}

const coreTemplates = [{
                         'title': 'Node 1 Document',
                         'completionEstimate': 8
                       },
                       {
                         'title': 'Node 2 Document',
                         'completionEstimate': 3
                       },
                       {
                         'title': 'Node 3 Document',
                         'completionEstimate': 3
                       }];

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
