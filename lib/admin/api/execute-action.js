var _ = require('lodash');
var formatData = require('./format-data');

module.exports = function (smocks) {

  return function (request, reply, respondWithConfig) {
    var actionId = request.payload.action;
    var routeId = request.payload.route;
    var input = request.payload.input || {};

    var executer;
    if (!routeId) {
      executer = function () {
        return smocks.actions.execute(actionId, input, request);
      };
    } else {
      executer = function () {
        var route = smocks.routes.get(routeId);
        if (route) {
          return route.actions.execute(actionId, input, request);
        }
      };
    }

    try {
      var actionResponse = executer();
      if (_.isNull(actionResponse)) {
        // no action found
        reply('no action found').code(404);
      } else {
        var rtn = respondWithConfig ? formatData(smocks, request) : {};
        rtn._actionResponse = actionResponse;
        reply(rtn);
      }
    } catch (e) {
      var message = _.isString(e) ? e : (e.message + '\n' + e.stack);
      console.error(message);
      reply(message).code(500);
    }

  };
};
