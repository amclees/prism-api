'use strict';

require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL;

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const Stage = require('../models/stage.model');

describe('The stage model', () => {
  let testId;
  let id1, id2, id3;

  beforeEach((done) => {
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

    new Stage({
      endNodes: [id3],
      nodes: nodesObject
    }).save()
        .then((saved) => {
          testId = saved._id;
          done();
        });
  });

  it('calculates future estimated dates properly', (done) => {
    Stage.findById(testId).then((testStage) => {
      expect(testStage.nodes[id1].finishDate).toEqual(new Date('2018-01-09'));
      expect(testStage.nodes[id2].finishDate).toEqual(new Date('2018-01-16'));
      expect(testStage.nodes[id3].finishDate).toEqual(new Date('2018-01-28'));
      done();
    });
  });
});
