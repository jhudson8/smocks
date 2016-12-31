var formatData = require('./format-data');

module.exports = function (smocks) {
  var harOptions = smocks.options && smocks.options.har;

  return function (request, reply, respondWithConfig) {
    smocks.state.userState(request)['__har'] = undefined;
    reply(respondWithConfig ? formatData(smocks, request) : {});
  };
};
