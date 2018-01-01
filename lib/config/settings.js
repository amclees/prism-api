'use strict';

module.exports = {
  saltRounds: 12,
  minUsernameLength: 4,
  maxUsernameLength: 20,
  maxProgramNameLength: 50,
  maxCommentLength: 2000,
  revisionExtensions: ['.doc', '.docx', '.pdf'],
  revisionMaxFileSize: (2 ** 20) * 5
};
