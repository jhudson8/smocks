var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply, respondWithConfig) {
    var id = request.params.name;
    var selected = mocker.profiles.applyProfile(id);
    if (!selected) {
      reply().code(404);
    }

    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
