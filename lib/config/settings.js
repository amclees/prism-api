'use strict';

module.exports = {
  saltRounds: 12,
  minUsernameLength: 4,
  maxUsernameLength: 20,
  maxProgramNameLength: 60,
  maxCommentLength: 2000,
  actionsPerPage: 150,
  revisionExtensions: [
    '.doc',
    '.docx',
    '.xlx',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.pdf',
    '.tif',
    '.txt',
    '.png',
    '.jpg',
    '.gif',
    '.bmp',
    '.psd',
    '.xcd',
    '.wav',
    '.ogg',
    '.mp3',
    '.mp4',
    '.mov'
  ],
  revisionMaxFileSize: (2 ** 20) * 50,
  revisionExternalMaxFileSize: (2 ** 20) * 50,
  // 30 minutes
  rateLimitWindow: 30 * 60 * 1000,
  // Applied globally
  requestLimit: 20000,
  // Applied only to the login endpoint
  loginRequestLimit: 25
};
