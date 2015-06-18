var _ = require('lodash');
var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
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

    if (!routeId) {
      try {
        var actionFound = executer();
        if (actionFound) {
          reply(formatData(mocker, request));
        } else {
          reply('no action found').code(404);
        }
      } catch (e) {
        if (_.isString(e)) {
          reply(e).code(500);
        } else {
          reply(e.message).code(500);
        }
      }
      return;
    }

  };
};
