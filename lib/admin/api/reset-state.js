var formatData = require('./format-data');

module.exports = function (smocks) {

  return function (request, reply, respondWithConfig) {
    smocks.state.resetUserState(request, JSON.parse(JSON.stringify(smocks.options.initialState || {})))

    reply(respondWithConfig ? formatData(smocks, request) : {});
  };
};
