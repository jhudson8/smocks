var formatData = require('./format-data');
var _ = require('lodash');

module.exports = function(route, mocker) {

  return function(request, reply) {
    var payload = request.payload;
    var variantId = payload.variant;
    var config = payload.config;

    if (variantId) {
      route.selectVariant(variantId, request);
    }
    if (config) {
      if (config.route) {
        _.extend(route.selectedRouteConfig(request), config.route);
      }
      if (config.variant) {
        _.extend(route.selectedVariantConfig(route.getActiveVariant(request), request), config.variant);
      }
    }

    reply(formatData(mocker, request));
  };
};
