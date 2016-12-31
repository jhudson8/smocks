var formatData = require('./format-data');

module.exports = function (smocks) {

  return function (request, reply, respondWithConfig) {
    var pluginId = request.params.pluginId;
    var id = request.payload.id;
    var value = request.payload.value;

    smocks.plugins.updateInput(pluginId, id, value, request);

    reply(respondWithConfig ? formatData(smocks, request) : {});
  };
};
