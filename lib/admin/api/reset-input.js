var _ = require('lodash');
var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply, respondWithConfig) {
    mocker.state.resetRouteState(request);

    _.each(mocker.routes.get(), function(route) {
      route.resetRouteVariant(request);
      route.resetSelectedInput(request);
    });
    mocker.plugins.resetInput(request);

    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
