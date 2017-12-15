module.exports = function(disconnect) {
  process.once('SIGUSR2', () => {
    disconnect('received SIGUSR2 signal (likely nodemon restart)', () => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });

  process.on('SIGINT', () => {
    disconnect('received interrupt signal', () => {
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    disconnect('received terminate signal', () => {
      process.exit(0);
    });
  });
};
