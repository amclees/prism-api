const winston = require('winston');

const disconnectErrorHandler = (err) => {
  winston.error('Could not diconnect from MongoDB, error:', err);
  process.exit(0);
};

module.exports = function(disconnect) {
  process.once('SIGUSR2', () => {
    disconnect('received SIGUSR2 signal (likely nodemon restart)', () => {
      process.kill(process.pid, 'SIGUSR2');
    }, disconnectErrorHandler);
  });

  process.on('SIGINT', () => {
    disconnect('received interrupt signal', () => {
      process.exit(0);
    }, disconnectErrorHandler);
  });

  process.on('SIGTERM', () => {
    disconnect('received terminate signal', () => {
      process.exit(0);
    }, disconnectErrorHandler);
  });
};
