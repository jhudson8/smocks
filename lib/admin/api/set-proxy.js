var formatData = require('./format-data');

module.exports = function(mocker) {
  return function(request, reply) {
    mocker.state.routeState(request).__proxy = request.payload.config;
    reply(formatData(mocker, request));
  };
};
