var formatData = require('./format-data');

module.exports = function (smocks) {
  var harOptions = smocks.options && smocks.options.har;

  return function (request, reply) {
    var id = request.params.id;
    var har = smocks.state.userState(request)['__har'];
    if (har) {
      for (var i=0; i<har.calls.length; i++) {
        var call = har.calls[i];
        if (call.id === id) {
          return reply(JSON.parse(call.response.content.text)).code(call.response.status);
        }
      }
    }

    reply().code(404);
  };
};
