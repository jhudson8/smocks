var formatData = require('./format-data');

module.exports = function(fixture, mocker) {

  return function(request, reply) {
    var payload = request.payload;
    if (payload.variant) {
      fixture.selectVariant(payload.variant);
    }

    reply(formatData(mocker));
  };
};
