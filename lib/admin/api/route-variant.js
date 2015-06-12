var formatData = require('./format-data');

module.exports = function(route, mocker) {

  return function(request, reply) {
    var payload = request.payload;
    if (payload.variant) {
      route.selectVariant(payload.variant, request);
    }

    reply(formatData(mocker));
  };
};
