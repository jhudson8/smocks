var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    var profile = request.payload;
    var selected = mocker.profiles.applyProfile(profile, request);
    if (!selected) {
      return reply().code(404);
    }

    reply(formatData(mocker, request));
  };
};
