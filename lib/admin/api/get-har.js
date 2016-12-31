var formatData = require('./format-data');

module.exports = function (smocks) {
  return function (request, reply) {
    var harData = formatData.formatHar(smocks, request);
    reply(harData || {});
  };
};
