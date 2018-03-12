const mongoose = require('mongoose');
const User = mongoose.model('User');
const Group = mongoose.model('Group');

const _ = require('lodash');

module.exports = {
  getUser: function(user) {
    return new Promise(function(resolve, reject) {
      let userDocument = new User(_.omit(user, 'password'));
      userDocument.setPassword(user.password).then(function() {
        userDocument.save().then(function(savedUser) {
          let groupPromises = user.groups ? user.groups.map(group => Group.findByIdAndUpdate(group, {$push: {members: savedUser._id}})) : [];
          Promise.all(groupPromises).then(resolve, reject);
        }, reject);
      }, reject);
    });
  },
  getUsers: function(users) {
    return Promise.all(users.map(this.getUser));
  }
};
