var _ = require('lodash');
var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    mocker.state.resetRouteState(request);

    _.each(mocker.routes.get(), function(route) {
      route.resetRouteVariant(request);
      route.resetSelectedConfig(request);
    });
    mocker.plugins.resetConfig(request);

    reply(formatData(mocker, request));
  };
};
