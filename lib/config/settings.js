'use strict';

module.exports = {
  saltRounds: 12,
  minUsernameLength: 4,
  maxUsernameLength: 20,
  maxProgramNameLength: 60,
  maxCommentLength: 2000,
  actionsPerPage: 150,
  revisionExtensions: ['.doc', '.docx', '.pdf'],
  revisionMaxFileSize: (2 ** 20) * 5,
  revisionExternalMaxFileSize: (2 ** 20) * 5
};
