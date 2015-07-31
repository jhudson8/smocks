var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    mocker.state.resetUserState(request);

    reply(formatData(mocker, request));
  };
};
