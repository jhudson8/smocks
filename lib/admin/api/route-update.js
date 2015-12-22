var formatData = require('./format-data');
var _ = require('lodash');

module.exports = function(route, mocker) {

  return function(request, reply, respondWithConfig) {
    var payload = request.payload;
    var variantId = payload.variant;
    var input = payload.input;

    if (variantId) {
      route.selectVariant(variantId, request);
    }
    if (input) {
      if (input.route) {
        _.extend(route.selectedRouteInput(request), input.route);
      }
      if (input.variant) {
        _.extend(route.selectedVariantInput(route.getActiveVariant(request), request), input.variant);
      }
    }

    reply(respondWithConfig ? formatData(mocker, request) : {});
  };
};
