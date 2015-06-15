var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    var id = request.params.name;
    var selected = mocker.profiles.apply(id);
    if (!selected) {
      reply().code(404);
    }

    reply(formatData(mocker, request));
  };
};
