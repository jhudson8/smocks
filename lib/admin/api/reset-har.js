var _ = require('lodash');
var fs = require('fs');
var formatData = require('./format-data');

module.exports = function(mocker) {
  var harOptions = mocker.initOptions && mocker.initOptions.har;

  return function(request, reply) {
    var harData = mocker.state.userState(request)['__har'];
    if (harData) {
      var calls = harData.calls;
      for (var i=0; i<calls.length; i++) {
        calls[i].responded = false;
      }
    }

    reply(formatData(mocker, request));
  };
};
