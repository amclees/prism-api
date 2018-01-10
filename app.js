require('dotenv').config();

require('./log.js');
const winston = require('winston');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const passport = require('passport');
const app = express();
app.disable('x-powered-by');

const access = require('./lib/access');
const db = require('./db');
db.init([access.init]);
const routes = require('./routes');
require('./lib/config/passport');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan(process.env.MORGAN_MODE ? process.env.MORGAN_MODE : 'combined', {stream: winston.infoStream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

const authMiddleware = passport.authenticate('jwt', {session: false});

app.use(function(req, res, next) {
  if (req.path === '/api/login') {
    next();
  } else {
    authMiddleware(req, res, next);
  }
});

for (let route of routes) {
  app.use('/api', route);
}

require('./error_handler')(app);

// Teardown can be passed any modules necessary for proper teardown
require('./teardown')(db.disconnect);

module.exports = app;
