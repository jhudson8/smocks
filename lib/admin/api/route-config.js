var formatData = require('./format-data');

module.exports = function(route, mocker) {

  return function(request, reply) {
    var payload = request.payload;
    var type = payload.type;
    var id = payload.id;
    var value = payload.value;

    if (type === 'route') {
      route.selectedConfig()[id] = value;
    } else if (type === 'variant') {
      route.getActiveVariant().selectedConfig(route)[id] = value;
    } else {
      return reply('invalid type: ' + type).code(500);
    }

    reply(formatData(mocker, request));
  };
};
