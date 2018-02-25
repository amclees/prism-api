global.Promise = require('bluebird');

require('dotenv').config();
const mongoose = require('mongoose');

module.exports = function() {
  return new Promise(function(resolve, reject) {
    const db = require('../db');
    db.init([]);

    Promise.all(mongoose.modelNames().map(modelName => mongoose.model(modelName).remove({}))).then(function() {
      const userFactory = require('../lib/user_factory');

      createGroups(['Administrators', 'Program Review Subcommittee']).then(function() {
        userFactory.getUser({
                     username: 'root',
                     password: 'password',
                     email: 'root@prism.calstatela.edu',
                     name: {
                       first: 'Root',
                       last: 'User'
                     },
                     internal: true,
                     root: true
                   })
            .then(resolve, reject);
      }, reject);
    }, reject);
  });
};

if (!module.parent) {
  module.exports().then(function() {
    console.log('Successfully set up production db');
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
