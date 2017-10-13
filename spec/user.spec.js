require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const User = require('../models/user.model');

describe('The user model', () => {
  let userData;
  const resetUser = () => {
    userData = {
      username: 'username',
      email: 'email@example.com',
      name: {
        first: 'first name',
        last: 'last name'
      },
      internal: true,
      root: false
    };
  };
  resetUser();

  afterEach(() => {
    resetUser();
  });

  it('returns an error if no username is provided', (done) => {
    userData.username = '';
    const user = new User(userData);

    user.setPassword('password');

    user.save((error) => {
      expect(error.message).toBe('User validation failed: username: Path `username` is required.');
      done();
    });
  });

  it('returns an error if the username is a duplicate', (done) => {
    const user1 = new User(userData);
    const user2 = new User(userData);

    user1.setPassword('password');
    user2.setPassword('password');

    user1.save((error) => {
      expect(error).toBe(null);
      if (error) {
        winston.log('debug', `Error saving first user in duplicate checking test: ${error.message}`);
      }
      user2.save((error2) => {
        expect(error2).not.toBe(null);
        done();
      });
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
