var formatData = require('./format-data');

module.exports = function (smocks) {

  return function (request, reply, respondWithConfig) {
    var profile = request.payload;
    var selected = smocks.profiles.applyProfile(profile, request);
    if (!selected) {
      return reply().code(404);
    }

    reply(respondWithConfig ? formatData(smocks, request) : {});
  };
};
