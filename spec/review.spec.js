'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const Review = require('../models/review.model');

describe('The review model', () => {
  const nodesErrorMessage = 'Review validation failed: nodes: Invalid nodes in Review';

  it('calculates future estimated dates properly', (done) => {
    let testId;
    let id1, id2, id3;
    const node1 = {
      startDate: new Date('2018-01-01'),
      completionEstimate: 8,
      prerequisites: []
    };
    id1 = mongoose.Types.ObjectId();
    const node2 = {
      startDate: new Date('2018-01-01'),
      completionEstimate: 15,
      prerequisites: []
    };
    id2 = mongoose.Types.ObjectId();
    const node3 = {
      completionEstimate: 12,
      prerequisites: [id1, id2]
    };
    id3 = mongoose.Types.ObjectId();
    const nodesObject = {};
    nodesObject[id1] = node1;
    nodesObject[id2] = node2;
    nodesObject[id3] = node3;

    new Review({
      program: mongoose.Types.ObjectId(),
      endNodes: [id3],
      nodes: nodesObject
    }).save()
        .then((saved) => {
          testId = saved._id;
          Review.findById(testId).then((testReview) => {
            expect(testReview.nodes[id1].finishDate).toEqual(new Date('2018-01-09'));
            expect(testReview.nodes[id2].finishDate).toEqual(new Date('2018-01-16'));
            expect(testReview.nodes[id3].finishDate).toEqual(new Date('2018-01-28'));
            done();
          });
        });
  });

  it('does not allow invalid values in fields of nodes', (done) => {
    let id1, id2, id3;
    const node1 = {
      startDate: new Date('2018-01-01'),
      completionEstimate: 8,
      // Invalid field
      prerequisites: ['e']
    };
    id1 = mongoose.Types.ObjectId();
    const node2 = {
      startDate: new Date('2018-01-01'),
      completionEstimate: 15,
      prerequisites: []
    };
    id2 = mongoose.Types.ObjectId();
    const node3 = {
      completionEstimate: 12,
      prerequisites: [id1, id2]
    };
    id3 = mongoose.Types.ObjectId();
    const nodesObject = {};
    nodesObject[id1] = node1;
    nodesObject[id2] = node2;
    nodesObject[id3] = node3;

    new Review({
      program: mongoose.Types.ObjectId(),
      endNodes: [id3],
      nodes: nodesObject
    }).save()
        .then(() => {}, (err) => {
          expect(err.message).toEqual(nodesErrorMessage);
          done();
        });
  });

  it('does not allow invalid fields in nodes', (done) => {
    let id1, id2, id3;
    const node1 = {
      startDate: new Date('2018-01-01'),
      completionEstimate: 8,
      prerequisites: [],
      fakeField: 'This is not a real field'
    };
    id1 = mongoose.Types.ObjectId();
    const node2 = {
      startDate: new Date('2018-01-01'),
      completionEstimate: 15,
      prerequisites: []
    };
    id2 = mongoose.Types.ObjectId();
    const node3 = {
      completionEstimate: 12,
      prerequisites: [id1, id2]
    };
    id3 = mongoose.Types.ObjectId();
    const nodesObject = {};
    nodesObject[id1] = node1;
    nodesObject[id2] = node2;
    nodesObject[id3] = node3;

    new Review({
      program: mongoose.Types.ObjectId(),
      endNodes: [id3],
      nodes: nodesObject
    }).save()
        .then(() => {}, (err) => {
          expect(err.message).toEqual(nodesErrorMessage);
          done();
        });
  });

  it('does not allow excessively large nodes objects', (done) => {
    const nodesObject = {};
    const ids = [];

    for (let i = 0; i < 10000; i++) {
      const node = {
        startDate: new Date('2018-01-01'),
        completionEstimate: 8,
        prerequisites: [],
      };
      const id = mongoose.Types.ObjectId();
      ids.push(id);
      nodesObject[id] = node;
    }

    new Review({
      program: mongoose.Types.ObjectId(),
      endNodes: ids,
      nodes: nodesObject
    }).save()
        .then(() => {}, (err) => {
          expect(err.message).toEqual(nodesErrorMessage);
          done();
        });
  });
});
