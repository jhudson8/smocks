var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply, respondWithConfig) {
    mocker.state.resetUserState(request);

    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
