/**
 * Exposes ability to get mock request content using an API without actually starting a server
 */
var smocks = require('./lib');
var _ = require('lodash');
var initialized = false;

function initialize (options) {
  if (!initialized) {
    var smocks = require('./lib');
    options = options || {};

    smocks._sanityCheckRoutes();
    options = smocks._sanitizeOptions(options);
    smocks.initOptions = options;
    initialized = true;
  } else {
    throw new Error('smocks has already been initialized');
  }
}

/**
 * Return a response as if the mock server were executed
 * routeId: the route id to identify the route handler
 * variantId: id of variant *only if something other than default is required*
 * context: optional context if route config and/or state is required for the response (see Config object)
 *
 */
function handler(routeId/*, variantId, options*/) {
  if (!initialized) {
    throw new Error('You must call `init` before executing API actions');
  }

  var variantId, options;
  for (var i = 1; i < arguments.length; i++) {
    arg = arguments[i];
    if (_.isString(arg)) {
      variantId = arg;
    } else {
      options = arg;
    }
  }
  options = options || {};

  var route = smocks.routes.get(routeId);
  if (!route) {
    throw new Error('invalid route: ' + routeId);
  }
  var variant = route.getVariant(variantId || 'default');
  if (!variant) {
    throw new Error('invalid variant: ' + (variantId || 'default') + ' for route: ' + routeId);
  }

  var context = new Context({
    route: route,
    variant: variant,
    input: options.input,
    state: options.state
  });

  var request = new Request(options);
  var reply = Reply();
  variant.handler.call(context, request, reply);

  return reply.payload;
}


function Request(options) {
  this.payload = options.payload;
  this.params = options.params;
  this.query = options.query;
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


function Context(options) {
  this._input = options.input || {};
  this._state = options.state || {};
  this.route = options.route;
  this.variant = options.variant;
}
_.extend(Context.prototype, {
  __Context: true,
  state: function (key, value) {
    if (_.isUndefined(value)) {
      return this._state[key];
    } else {
      this._state[key] = value;
    }
  },
  input: function (key) {
    return this._input[key];
  },
  meta: function (key) {
    return (this.route.meta() || {})[key];
  }
});

module.exports = {
  init: initialize,
  get: handler
};
