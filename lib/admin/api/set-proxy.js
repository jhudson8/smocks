var formatData = require('./format-data');

module.exports = function(mocker) {
  return function(request, reply, respondWithConfig) {
    mocker.state.routeState(request).__proxy = request.payload.config;
    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
