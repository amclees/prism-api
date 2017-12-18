const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const fs = require('fs');

const LOGS_FOLDER = process.env.LOGS_FOLDER ? process.env.LOGS_FOLDER : 'logs';

if (!fs.existsSync(LOGS_FOLDER)) {
  fs.mkdirSync(LOGS_FOLDER);
}

winston.configure({
  exitOnError: false,
  transports: [
    new winston.transports.Console({
      level: (process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug'),
      handleExceptions: true,
      json: false,
      colorize: true
    }),
    new winston.transports.File({
      level: 'info',
      filename: `./${LOGS_FOLDER}/main-logs.log`,
      colorize: false,
      handleExceptions: true,
      maxsize: ((2 ** 20) * 10),
      maxFiles: 10
    })
  ]
});

winston.infoStream = {
  write: function(msg) {
    winston.info(msg);
  }
};
