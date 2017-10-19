'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const settings = require('../lib/config/settings');
const Program = require('../lib/models/program.model');

describe('The program model', () => {
  beforeEach((done) => {
    Program.remove({}, function(error) {
      if (error) {
        winston.log('error', `Error removing all documents from database between tests: ${error.message}`);
      }
      done();
    });
  });

  it('allows creation of programs with valid names', (done) => {
    const program = new Program({name: 'Art B.A.'});
    program.save((error) => {
      expect(error).toBe(null);
      done();
    });
  });

  it('verifies the program name is included', (done) => {
    const program = new Program({name: ''});
    program.save((error) => {
      expect(error).not.toBe(null);
      done();
    });
  });

  it('verifies the program name is under maximum length', (done) => {
    const program = new Program({name: 'a'.repeat(settings.maxProgramNameLength + 1)});
    program.save((error) => {
      expect(error).not.toBe(null);
      done();
    });
  });

  it('verifies the program name has only valid characters', (done) => {
    const program = new Program({name: 'Art *'});
    program.save((error) => {
      expect(error).not.toBe(null);
      done();
    });
  });

  it('verifies the program name is unique', (done) => {
    const program1 = new Program({name: 'Art B.A.'});
    const program2 = new Program({name: 'Art B.A.'});
    program1.save((error) => {
      expect(error).toBe(null);
      program2.save((error2) => {
        expect(error2).not.toBe(null);
        done();
      });
    });
  });
});
