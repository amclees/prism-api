const winston = require('winston');

function replaceErrors(key, value) {
  if (value instanceof Error) {
    const error = {};
    for (let subkey of Object.getOwnPropertyNames(value)) {
      error[subkey] = value[subkey];
    }
    return error;
  }
  return value;
}

module.exports = function(app) {
  app.use(function(req, res, next) {
    winston.info('Ran 404');
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use(function(err, req, res, next) {
    winston.debug('Caught error:', err);

    if (err.name === 'ValidationError') {
      err.status = 400;
    } else if (err.message === 'Invalid file extension') {
      err.status = 400;
    } else if (err.message === 'File too large') {
      err.status = 400;
    } else if (err.message === 'Forbidden') {
      err.status = 403;
    }

    res.status(err.status || 500);
    if (req.app.get('env') === 'development') {
      res.set('Content-Type', 'application/json');
      res.send(JSON.stringify(err, replaceErrors));
    } else {
      res.json({'error': 'An error has occured. Please contact the system administrators.'});
    }
  });
};
