var _ = require('lodash');
var fs = require('fs');
var formatData = require('./format-data');

module.exports = function(mocker) {
  var harOptions = mocker.initOptions && mocker.initOptions.har;

  return function(request, reply) {
    var harData = mocker.state.userState(request)['__har'];
    if (harData) {
      if (request.payload.reset) {
        reset(harData);
      }

      if (!_.isUndefined(request.payload.startIndex)) {
        harData.startIndex = Math.max(0, request.payload.startIndex);
      }
    }

    reply(formatData(mocker, request));
  };
};

function reset (harData) {
  var calls = harData.calls;
  for (var i=0; i<calls.length; i++) {
    calls[i].responded = false;
  }
}
