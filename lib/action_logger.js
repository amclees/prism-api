const winston = require('winston');

const mongoose = require('mongoose');
const Action = mongoose.model('Action');

exports.log = function(text, user, type, object) {
  const action = new Action({
    'text': text,
    'user': user._id,
    'type': type,
    'object': object
  });
  action.save().then(function() {}, function(err) {
    winston.error('Error saving action. Action:', action, 'Error:', err);
  });
};
