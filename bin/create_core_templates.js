'use strict';

require('dotenv').config();
const _ = require('lodash');

const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(process.env.DB_HOST, {useMongoClient: true});

const Document = require('../models/document.model');

const coreTemplates = [{
                         'title': 'Node 1 Document',
                         'completionEstimate': 8
                       },
                       {
                         'title': 'Node 2 Document',
                         'completionEstimate': 3
                       },
                       {
                         'title': 'Node 3 Document',
                         'completionEstimate': 3
                       }];

Document.remove({coreTemplate: true}).then(function() {
  Promise.all(coreTemplates.map(function(template) {
           return (new Document(_.assign({
                    'template': true,
                    'coreTemplate': true
                  },
                                         template)))
               .save();
         }))
      .then(function() {
        console.log('Successfully created core templates');
        process.exit(0);
      }, printError);
}, printError);



function printError(err) {
  console.log('Error adding templates: ' + err);
  process.exit(1);
}
