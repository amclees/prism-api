require('dotenv').config();

require('./log.js');
const winston = require('winston');

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();
app.disable('x-powered-by');

const db = require('./db');
const routes = require('./routes');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan(process.env.MORGAN_MODE ? process.env.MORGAN_MODE : 'combined', {stream: winston.infoStream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

for (let route of routes) {
  app.use(route);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Teardown can be passed any modules necessary for proper teardown
require('./teardown')(db.disconnect);

module.exports = app;
