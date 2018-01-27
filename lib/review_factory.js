const _ = require('lodash');

const mongoose = require('mongoose');
const Document = mongoose.model('Document');
const Review = mongoose.model('Review');

const documentFactory = require('./document_factory');

let id1, id2, id3;
const node1 = {
  templateName: 'Node 1 Document',
  startDate: new Date('2018-01-01'),
  prerequisites: []
};
id1 = mongoose.Types.ObjectId();
const node2 = {
  templateName: 'Node 2 Document',
  startDate: new Date('2018-01-01'),
  prerequisites: []
};
id2 = mongoose.Types.ObjectId();
const node3 = {
  templateName: 'Node 3 Document',
  prerequisites: [id1, id2]
};
id3 = mongoose.Types.ObjectId();
const nodesObject = {};
nodesObject[id1] = node1;
nodesObject[id2] = node2;
nodesObject[id3] = node3;

let baseReview = {
  endNodes: [id3],
  nodes: nodesObject
};

module.exports = {
  getReview: function(nodelessReviewObject) {
    return new Promise(function(resolve, reject) {
      getTemplateIds().then(function(templateIds) {
        let documentPromises = _.values(baseReview.nodes).map(function(node) {
          return documentFactory.getDocumentFromTemplate(templateIds[node.templateName]);
        });
        Promise.all(documentPromises).then(function(documents) {
          resolve(new Review(_.assign(nodelessReviewObject, {
            endNodes: baseReview.endNodes,
            nodes: _.values(baseReview.nodes).map(function(node, index) {
              node.document = documents[index]._id;
              node.completionEstimate = node.document.completionEstimate;
              return _.pick(node, ['completionEstimate', 'prerequisites', 'document']);
            })
          })));
        }, reject);
      }, reject);
    });
  }
};

function getTemplateIds() {
  return new Promise(function(resolve, reject) {
    Document.find({coreTemplate: true}).then(function(documents) {
      const templateIds = {};
      for (let document of documents) {
        templateIds[document.title] = document._id;
      }
      resolve(templateIds);
    }, reject);
  });
}
