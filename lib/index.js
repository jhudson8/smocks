var _ = require('lodash');
var Route = require('./route-model');
var Variant = require('./variant-model');
var Plugin = require('./plugin-model');
var util = require('./util');

var addOns = {
  'reset-variants': require('./addons/reset-variants'),
  'response-delay': require('./addons/response-delay'),
  'response-error': require('./addons/response-error')
};

var lastSmocksInstance;
function createSmocksInstance (id) {
  var _subscriptions = [];
  var _websocketConnectionHandlers = [];
  var _websocketDisconnectionHandlers = [];
  var _websocketMessageHandlers = [];
  var _routes = [];
  var _plugins = [];
  var _variants = {};
  var _profiles = {};
  var _actions = {};
  var _displayFunc;
  var _connection;

  var smocksInstance = lastSmocksInstance = module.exports.lastSmocksInstance = {
    id: function () {
      return id;
    },

    addOn: function (id, options) {
      var addon = addOns[id];
      if (addon) {
        addon(options, smocksInstance);
        return smocksInstance;
      } else {
        throw new Error('Invalid addon: ' + id);
      }
    },

    connection: function (connection) {
      if (connection) {
        _connection = connection;
      }
      return _connection;
    },

    display: function (func) {
      if (func) {
        _displayFunc = func;
      } else {
        return _displayFunc;
      }
    },

    route: function (data) {
      if (!data.path) {
        throw new Error('Routes must be in the form of {path: "...", method: "..."}');
      } else {
        var route = new Route(data, smocksInstance);
        _routes.push(route);
        return route;
      }
    },

    subscription: function (path, options) {
      if (typeof path !== 'string') {
        throw new Error('Subscription must be a string.');
      } else {
        _subscriptions.push({ path: path, options: options });
      }
    },

    onWebsocketConnection: function (func) {
      if (typeof func !== 'function') {
        throw new Error('onConnection must be a function.');
      } else {
        _websocketConnectionHandlers.push(func);
      }
    },

    onWebsocketDisconnection: function (func) {
      if (typeof func !== 'function') {
        throw new Error('onDisconnection must be a function.');
      } else {
        _websocketDisconnectionHandlers.push(func);
      }
    },

    onWebsocketMessage: function (func) {
      if (typeof func !== 'function') {
        throw new Error('onMessage must be a function.');
      } else {
        _websocketMessageHandlers.push(func);
      }
    },

    method: function (route, method) {
      if (route.hasVariants()) {
        // we need a new route
        var _route = smocksInstance.route({ path: route.path });
        _route._method = method;
        return _route;
      } else {
        // we can repurpose the current route
        route._method = method;
        return route;
      }
    },

    variant: function (data) {
      var variant = new Variant(data, smocksInstance);
      _variants[variant.id()] = variant;
      return variant;
    },

    profile: function (id, profile) {
      _profiles[id] = profile;
    },

    action: function (id, options) {
      if (!options) {
        options = id;
        id = options.id;
      } else {
        options.id = id;
      }

      _actions[id] = options;
      return smocksInstance;
    },

    actions: {
      get: function () {
        return _actions;
      },
      execute: function (id, input, request) {
        var action = _actions[id];
        if (!action) {
          return null;
        } else {
          return util.executionContext({
            request: request,
            smocks: smocksInstance
          }, function (context) {
            return action.handler.call(context, input);
          });
        }
      }
    },

    profiles: {
      applyProfile: function (profile, request) {
        if (_.isString(profile)) {
          profile = _profiles[profile];
        }
        if (profile) {
          // reset the state first
          smocksInstance.state.resetRouteState(request);
          _.each(_routes, function (route) {
            route.applyProfile((route._id && profile[route._id]) || {}, request);
          });

          // FIXME we're only resetting global plugin state where we should be saving that in a profile
          smocksInstance.plugins.resetInput(request);
          return true;
        } else {
          return false;
        }
      },

      get: function (id) {
        if (!id) {
          return _profiles;
        }
        return _profiles[id];
      }
    },

    plugin: function (data) {
      var plugin = new Plugin(data, smocksInstance);
      if (plugin.plugin) {
        plugin.plugin(smocksInstance);
      }
      _plugins.push(plugin);
      return smocksInstance;
    },

    plugins: {
      get: function () {
        return _plugins;
      },

      resetInput: function (request) {
        var state = smocksInstance.state.routeState(request);
        var pluginState = state._pluginState = {};
        _.each(_plugins, function (plugin) {
          var input = plugin.input();
          if (input) {
            pluginState[plugin.id()] = {};
            _.each(input, function (data, id) {
              smocksInstance.plugins.updateInput(plugin.id(), id, data.defaultValue, request);
            });
          }
        });
      },

      updateInput: function (pluginId, id, value, request) {
        var input = smocksInstance.state.routeState(request)._pluginState;
        var pluginInput = input[pluginId];
        if (!pluginInput) {
          pluginInput = {};
          input[pluginId] = pluginInput;
        }
        pluginInput[id] = value;
      },

      getInput: function (request) {
        return smocksInstance.state.routeState(request)._pluginState;
      },

      getInputValue: function (pluginId, id, request) {
        var input = smocksInstance.state.routeState(request)._pluginState[pluginId];
        return input && input[id];
      }
    },

    routes: {
      get: function (id) {
        if (!id) {
          return _routes;
        }
        for (var i=0; i<_routes.length; i++) {
          if (_routes[i].id() === id) {
            return _routes[i];
          }
        }
      },
    },

    subscriptions: {
      get: function (id) {
        return _subscriptions;
      },
    },

    websocketConnectionHandlers: {
      run: function (server, socket) {
        _websocketConnectionHandlers.forEach(function (handler) {
          handler(server, socket);
        });
      },
    },

    websocketDisconnectionHandlers: {
      run: function (server, socket) {
        _websocketDisconnectionHandlers.forEach(function (handler) {
          handler(server, socket);
        });
      },
    },

    websocketMessageHandlers: {
      run: function (server, socket, message, reply) {
        _websocketMessageHandlers.forEach(function (handler) {
          handler(server, socket, message, reply);
        });
      },
    },

    variants: {
      get: function (id) {
        if (!id) {
          return _.map(_variants, function (variant) { return variant; });
        }
        return _variants[id];
      }
    },

    global: function () {
      return smocksInstance;
    },

    done: function () {
      return smocksInstance;
    },

    findRoute: function (id) {
      return _.find(_routes, function (route) {
        return route._id === id;
      });
    },

    _sanitizeOptions: function (options) {
      options = _.clone(options || {});
      if (options.state) {
        if (options.state === 'cookie' || options.state === 'request') {
          var CookieState = require('./state/cookie-state');
          options.state = new CookieState();
        } else if (options.state === 'static') {
          options.state = require('./state/static-state')();
        }
        if (!options.state.initialize) {
          console.error('state handler *must* implement "initialize" method: ', options.state);
          process.exit(1);
        }
      } else {
        options.state = require('./state/static-state')();
      }

      return options;
    },

    _sanityCheckRoutes: function () {
      var routeIndex = {};
      _.each(_routes, function (route) {
        var id = route.id();
        if (routeIndex[id]) {
          console.error('duplicate route key "' + id + '"');
          process.exit(1);
        } else {
          routeIndex[id] = true;
        }

        var variants = route.variants();
        var variantIndex = {};
        _.each(variants, function (variant) {
          id = variant.id();
          if (variantIndex[id]) {
            console.error('duplicate variant key "' + id + '" for route "' + route.id() + '"');
            process.exit(1);
          } else {
            variantIndex[id] = true;
          }
        });
      });
    }
  };

  smocksInstance.db = require('./datastore')({
    defaultStore: function smocksDbStore () {
      var context = smocksInstance.context;
      if (context) {
        var store = context.state('db');
        if (!store) {
          store = {};
          context.state('db', store);
        }
        return store;
      }
    }
  });

  require('./plugins/har-viewer-plugin')(smocksInstance);
  require('./plugins/proxy-plugin')(smocksInstance);

  require('./hapi')(smocksInstance);

  return smocksInstance;
}

// allow for backwards compatibility
['connection', 'route', 'variant', 'profile', 'action', 'plugin', 'global', 'findRoute'].forEach(function (key) {
  module.exports[key] = function () {
    if (!lastSmocksInstance) {
      throw new Error('you must call smocks(_id_) before calling `' + key + '`');
    }
    return lastSmocksInstance[key].apply(lastSmocksInstance, arguments);
  };
});

module.exports = createSmocksInstance;
