var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    mocker.state.resetConfigState(request);

    reply(formatData(mocker, request));
  };
};
