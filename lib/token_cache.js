const cache = {};

module.exports.modifyUser = function(id, date) {
  if (cache[id]) {
    cache[id].lastModified = date || (new Date()).getTime();
  }
};

module.exports.issueToken = function(id, token, date) {
  cache[id] = {
    'token': token,
    'lastModified': date || (new Date()).getTime()
  };
};

module.exports.validToken = function(id, token) {
  return process.env.SKIP_CACHE_TOKEN_VALIDATION || (cache[id] && cache[id].token === token);
};

module.exports.upToDateToken = function(jwt_payload) {
  return jwt_payload && cache[jwt_payload._id] && cache[jwt_payload._id].lastModified === jwt_payload.issued;
};
