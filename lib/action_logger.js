const winston = require('winston');

const mongoose = require('mongoose');
const Action = mongoose.model('Action');

exports.log = function(text, user, type, object, label) {
  const action = new Action({
    'text': text,
    'user': user._id,
    'type': type,
    'object': object,
    'label': label
  });
  action.save().then(function() {}, function(err) {
    winston.error('Error saving action. Action:', action, 'Error:', err);
  });
};
