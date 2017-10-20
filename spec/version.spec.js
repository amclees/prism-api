'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const Version = require('../models/version.model');
const User = require('../models/user.model');

describe('The version model', () => {
  const user = new User({
    username: 'username',
    email: 'email@example.com',
    name: {
      first: 'first name',
      last: 'last name'
    },
    internal: true,
    root: false
  });
  let versionData;

  beforeEach((done) => {
    versionData = {
      filePath: './spec/fixtures/test.txt',
      versionMessage: 'First test document',
      uploader: user._id
    };
    Version.remove({}, function(error) {
      if (error) {
        winston.log('error', `Error removing all Version documents from database between tests: ${error.message}`);
      }
      done();
    });
  });

  it('allows creating a version with valid data', (done) => {
    const version = new Version(versionData);

    version.save((error) => {
      expect(error).toBe(null);
      done();
    });
  });

  it('requires a version message', (done) => {
    versionData.versionMessage = '';
    const version = new Version(versionData);

    version.save((error) => {
      expect(error).not.toBe(null);
      done();
    });
  });

  it('stores the date when it was created', (done) => {
    const version = new Version(versionData);

    version.save((error) => {
      expect(error).toBe(null);
      expect(version.dateUploaded).not.toBe(null);
      done();
    });
  });
});
