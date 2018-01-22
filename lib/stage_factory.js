const _ = require('lodash');

const mongoose = require('mongoose');
const Stage = mongoose.model('Stage');

const documentFactory = require('./document_factory');

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

let baseStage = {
  endNodes: [id3],
  nodes: nodesObject
};

module.exports = {
  getStage: function() {
    return new Promise(function(resolve, reject) {
      let documentPromises = _.values(baseStage.nodes).map(function(node) {
        return documentFactory.getDocumentFromTemplate(templateId(node.templateName));
      });
      Promise.all(documentPromises).then(function(documents) {
        resolve(new Stage({
          endNodes: baseStage.endNodes,
          nodes: _.values(baseStage.nodes).map(function(node, index) {
            node.document = documents[index]._id;
            return _.pick(node, ['completionEstimate', 'prerequisites', 'document']);
          })
        }));
      }, reject);
    });
  }
};

function templateId() {
  return null;
}
