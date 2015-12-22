var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply, respondWithConfig) {
    var profile = request.payload;
    var selected = mocker.profiles.applyProfile(profile, request);
    if (!selected) {
      return reply().code(404);
    }

    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
