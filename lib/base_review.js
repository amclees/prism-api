const mongoose = require('mongoose');

const templates = [];
const nodesObject = {};

const nodes = [{
                 'title': 'External Review Report',
                 'completionEstimate': 3
               },
               {
                 'title': 'Questions',
                 'completionEstimate': 3,
                 'downloadGroups': ['University']
               },
               {
                 'title': 'Response to Questions',
                 'completionEstimate': 3,
                 'groups': ['Administrators', 'Program Review Subcommittee', 'University']
               },
               {
                 'title': 'Follow-up Questions',
                 'completionEstimate': 3,
                 'downloadGroups': ['University']
               },
               {
                 'title': 'Response to Follow-up Questions',
                 'completionEstimate': 3,
                 'groups': ['Administrators', 'Program Review Subcommittee', 'University']
               },
               {
                 'title': 'Commendations and Recommendations',
                 'completionEstimate': 3
               },
               {
                 'title': 'Self-study Document',
                 'completionEstimate': 3,
                 'groups': ['Administrators', 'Program Review Subcommittee', 'University']
               },
               {
                 'title': 'Draft Summary Report',
                 'completionEstimate': 3
               },
               {
                 'title': 'Final Summary Report',
                 'completionEstimate': 3
               },
               {
                 'title': 'Memorandum of Understanding',
                 'completionEstimate': 3,
                 'groups': ['Administrators', 'University']
               }];

for (let node of nodes) {
  node.id = mongoose.Types.ObjectId();
}

setPrerequisites(0, []);
setPrerequisites(1, [0, 6]);
setPrerequisites(2, [1]);
setPrerequisites(3, [2]);
setPrerequisites(4, [3]);
setPrerequisites(5, [0, 6]);
setPrerequisites(6, []);
setPrerequisites(7, [0, 6]);
setPrerequisites(8, [7]);
setPrerequisites(9, [4, 5, 8]);

for (let node of nodes) {
  addNode(node);
}

module.exports = {
  'review': {
    nodes: nodesObject,
    endNodes: [nodes[9].id]
  },
  'templates': templates
};

function setPrerequisites(index, prerequisites) {
  nodes[index].prerequisites = prerequisites.map(prerequisite => nodes[prerequisite].id);
}

function addNode(node) {
  templates.push({
    'title': node.title,
    'completionEstimate': node.completionEstimate,
    'groups': node.groups || ['Administrators', 'Program Review Subcommittee'],
    'downloadGroups': node.downloadGroups || []
  });
  nodesObject[node.id] = {
    'templateName': node.title,
    'prerequisites': node.prerequisites
  };
}
