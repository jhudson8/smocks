var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    mocker.state.reset(request);

    reply(formatData(mocker));
  };
};
