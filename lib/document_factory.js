const mongoose = require('mongoose');
const Document = mongoose.model('Document');

module.exports = {
  getDocumentFromTemplate: function(templateId) {
    return new Promise(function(resolve, reject) {
      Document.findById(templateId).then(function(template) {
        if (template === null) {
          reject(new Error(`Template id ${templateId} was not found`));
          return;
        }
        if (!template.template) {
          reject(new Error('Non-templates may not be used to instantiate documents'));
          return;
        }
        let latestRevision = null;
        for (let i = template.revisions.length - 1; i >= 0; i--) {
          if (latestRevision < 0) {
            break;
          }
          latestRevision = template.revisions[i];
          if (!latestRevision.deleted) {
            break;
          }
        }
        const document = new Document({
          'title': template.title,
          'completionEstimate': template.completionEstimate,
          'revisions': latestRevision === null ? [] : [latestRevision]
        });
        document.save(function() {
          resolve(document);
        }, reject);
      }, reject);
    });
  }
};
