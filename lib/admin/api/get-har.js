var formatData = require('./format-data');

module.exports = function(mocker) {
  return function(request, reply) {
    var harData = formatData.formatHar(mocker, request);
    reply(harData || {});
  };
};
