var formatData = require('./format-data');

module.exports = function (smocks) {
  return function (request, reply, respondWithConfig) {
    smocks.state.routeState(request).__proxy = request.payload.config;
    reply(respondWithConfig ? formatData(smocks, request) : {});
  };
};
