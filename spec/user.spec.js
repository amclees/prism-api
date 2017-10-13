require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const User = require('../models/user.model');

describe('The user model', () => {
  it('returns an error if no username is provided', (done) => {
    const user = new User({
      username: undefined,
      email: 'email@example.com',
      name: {
        first: 'first name',
        last: 'last name'
      },
      internal: true,
      root: false
    });

    user.setPassword('password');

    user.save((error) => {
      expect(error.message).toBe('User validation failed: username: Path `username` is required.');
      done();
    });
  });

  it('hashes and verifies the password', (done) => {
    const user = new User({});
    user.setPassword('password').then(() => {
      winston.log('debug', `User passwordHash=${user.passwordHash}\n`);
      user.comparePassword('password').then((same) => {
        expect(same).toBe(true);
        done();
      });
    });
  });
});
