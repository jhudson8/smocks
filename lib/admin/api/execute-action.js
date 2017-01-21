var _ = require('lodash');
var formatData = require('./format-data');

module.exports = function (smocks) {

  return function (request, reply, respondWithConfig) {
    var actionId = request.payload.action;
    var routeId = request.payload.route;
    var input = request.payload.input || {};

    var exec;
    if (!routeId) {
      exec = function () {
        return smocks.actions.execute(actionId, input, request);
      };
    } else {
      var route = smocks.routes.get(routeId);
      if (route) {
        exec = function () {
          return route.actions.execute(actionId, input, request);
        };
      }
    }

    try {
      if (!exec) {
        // no action found
        reply('no action found').code(404);
      } else {
        var actionResponse = exec();
        if (actionResponse === null) {
          return reply('no action found').code(404);
        }
        var rtn = respondWithConfig ? formatData(smocks, request) : {};
        if (typeof actionResponse !== 'undefined') {
          rtn._actionResponse = actionResponse;
        }
        reply(rtn);
      }
    } catch (e) {
      console.log(e);
      var actionErrorResponse = _.isString(e) ? e : (e.message);
      var rtn = respondWithConfig ? formatData(smocks, request) : {};
      if (typeof actionErrorResponse !== 'undefined') {
        rtn._actionErrorResponse = actionErrorResponse;
      }
      reply(rtn).code(500);
    }

  };
};
