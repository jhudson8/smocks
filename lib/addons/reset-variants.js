var _ = require('lodash');

module.exports = function (options, smocks) {
  options = options || {};
  var defaultValue = _.isUndefined(options.defaultValue) ? false : options.defaultValue;

  smocks.plugin({
    id: 'reset-variant',
    input: {
      reset_variant: {
        label: 'Return to default after alternate variant is used',
        type: 'boolean',
        defaultValue: defaultValue
      }
    },
    onRequest: function (request, reply, server, next) {
      next();
      if (this.input('reset_variant')) {
        var route = this.route;
        var variant = route.getActiveVariant(request);
        var variantId = variant.id();
        if (variantId !== 'default') {
          // make sure there is a default variant
          var allVariants = route.variants();
          for (var i = 0; i < allVariants.length; i++) {
            if (allVariants[i].id() === 'default') {
              route.selectVariant('default', request);
              break;
            }
          }
        }
      }
    }
  });

  return smocks;
}
