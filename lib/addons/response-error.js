var _ = require('lodash');

module.exports = function (options, smocks) {
  var code = options.code || 500;
  var response = options.response;

  smocks.variant({
    id: options.id || ('response-error-' + code),
    label: options.label || (options.code + ' error response'),
    input: options.input,

    handler: function (request, reply, server) {
      if (_.isFunction(options.response)) {
        reply(response.call(this)).code(code);
      } else {
        reply(response).code(code);
      }
    }
  });

  return smocks;
}
