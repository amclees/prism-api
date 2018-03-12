const mongoose = require('mongoose');

module.exports.getSubscribeMiddleware = function(modelName, shouldSubscribe) {
  return function(req, res, next) {
    mongoose.model(modelName).findById(req.params.id).then(function(document) {
      if (document === null) {
        next();
        return;
      }
      const index = document.subscribers.indexOf(req.user._id);
      if (shouldSubscribe && index === -1) {
        document.subscribers.push(req.user._id);
        document.save().then(function() {
          res.sendStatus(204);
        }, next);
      } else if (!shouldSubscribe && index !== -1) {
        document.subscribers.splice(index, 1);
        document.save().then(function() {
          res.sendStatus(204);
        }, next);
      } else {
        res.sendStatus(400);
      }
    }, next);
  };
};
