var _ = require('lodash');
var formatData = require('./format-data');

module.exports = function (smocks) {

  return function (request, reply, respondWithConfig) {
    smocks.state.resetRouteState(request);

    _.each(smocks.routes.get(), function (route) {
      route.resetRouteVariant(request);
      route.resetSelectedInput(request);
    });
    smocks.plugins.resetInput(request);

    reply(respondWithConfig ? formatData(smocks, request) : {});
  };
};
