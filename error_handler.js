const winston = require('winston');

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
    }

    res.status(err.status || 500);
    res.json(req.app.get('env') === 'development' ? err : {'error': 'An error has occured. Please contact the system administrators.'});
  });
};
