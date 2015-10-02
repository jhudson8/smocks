var formatData = require('./format-data');

module.exports = function(mocker) {
  var harOptions = mocker.initOptions && mocker.initOptions.har;

  return function(request, reply) {
    mocker.state.userState(request)['__har'] = undefined;
    reply(formatData(mocker, request));
  };
};
