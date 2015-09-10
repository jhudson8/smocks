/**
 * Exposes ability to get mock request content using an API without actually starting a server
 */
var smocks = require('./lib');
var _ = require('lodash');

/**
 * Return a response as if the mock server were executed
 * routeId: the route id to identify the route handler
 * variantId: id of variant *only if something other than default is required*
 * context: optional context if route config and/or state is required for the response (see Config object)
 * 
 */
function get(routeId/*, variantId, context, options*/) {
  var variantId, context, options, arg;
  for (var i=1; i<arguments.length; i++) {
    arg = arguments[i];
    if (_.isString(arg)) {
      variantId = arg;
    } else if (arg && arg.__Context) {
      context = arg;
    } else if (arg) {
      options = arg;
    }
  }
  options = options || {};

  if (!context) {
    // create an empty context
    context = new Context({config: options.config});
  }

  var route = smocks.routes.get(routeId);
  if (!route) {
    throw new Error('invalid route: ' + routeId);
  }
  var variant = route.getVariant(variantId || 'default');
  if (!variant) {
    throw new Error('invalid variant: ' + (variantId || 'default') + ' for route: ' + routeId);
  }

  var request = new Request(options);
  var reply = Reply();
  variant.handler.call(context || this, request, reply);

  return reply.payload;
}


function Request(options) {
  this.payload = options;
  this.params = options;
  this.query = options;
}

function Reply() {
  var rtn = function(payload) {
    rtn.payload = payload;
    return {
      code: function(code) {
        rtn.code = code;
      }
    }
  }
  rtn.code = 200;
  return rtn;
}


function Context(config, state) {
  this._config = config || {};
  this._state = state || {};
}
_.extend(Context.prototype, {
  __Context: true,
  state: function(key, value) {
    if (_.isUndefined(value)) {
      return this._state[key];
    } else {
      this._state[key] = value;
    }
  },
  config: function(key) {
    return this._config[key];
  }
});

module.exports = {
  get: get,
  Context: Context
};
