var formatData = require('./format-data');
var _ = require('lodash');

module.exports = function(route, mocker) {

  return function(request, reply) {
    var payload = request.payload;
    var variantId = payload.variant;
    var settings = payload.settings;

    if (variantId) {
      route.selectVariant(variantId, request);
    }
    if (settings) {
      _.extend(route.selectedVariantConfig(route.getActiveVariant(request), request), settings);
    }

    reply(formatData(mocker, request));
  };
};
