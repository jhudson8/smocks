var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply, respondWithConfig) {
    var pluginId = request.params.pluginId;
    var id = request.payload.id;
    var value = request.payload.value;

    mocker.plugins.updateInput(pluginId, id, value, request);

    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
