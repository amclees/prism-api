const winston = require('winston');

module.exports.deleteFile = function(filePath) {
  winston.info(`Mock deleteFile method called for filePath ${filePath}`);
  return new Promise(function(resolve) {
    resolve();
  });
};
