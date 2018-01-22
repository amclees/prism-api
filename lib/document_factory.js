const mongoose = require('mongoose');
const Document = mongoose.model('Document');

module.exports = {
  getDocumentFromTemplate: function(templateId) {
    return new Promise(function(resolve, reject) {
      Document.findById(templateId).then(function(template) {
        if (!template.template) {
          reject(new Error('Non-templates may not be used to instantiate documents'));
        }
        let latestRevision = null;
        for (let i = latestRevision.length - 1; i > 0; i--) {
          latestRevision = template.revisions[template.revisions.length - i];
          if (!latestRevision.deleted) {
            break;
          }
        }
        if (latestRevision === null) {
          reject(new Error('Only templates with valid revisions may be used to instantiate documents'));
        }
        resolve(new Document({
          'title': template.title,
          'revisions': [latestRevision]
        }));
      }, reject);
    });
  }
};
