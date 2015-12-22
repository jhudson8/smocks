var _ = require('lodash');
var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply, respondWithConfig) {
    var actionId = request.payload.action;
    var routeId = request.payload.route;
    var config = request.payload.config;

    var executer;
    if (!routeId) {
      executer = function() {
        return mocker.actions.execute(actionId, config, request);
      };
    } else {
      executer = function() {
        var route = mocker.routes.get(routeId);
        if (route) {
          return route.actions.execute(actionId, config, request);
        }
      };
    }

    try {
      var actionResponse = executer();
      if (_.isNull(actionResponse)) {
        // no action found
        reply('no action found').code(404);
      } else {
        var rtn = respondWithConfig ? formatData(mocker, request) : {};
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
