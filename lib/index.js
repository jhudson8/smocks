var _ = require('lodash');
var Route = require('./route-model');
var Variant = require('./variant-model');
var Plugin = require('./plugin-model');

var CONFIG = {};
var _routes = [];
var _plugins = [];
var _variants = {};
var _profiles = {};
var _actions = {};


var smocksInstance = module.exports = {
  route: function(data) {
    if (!data.path) {
      console.error('Routes must be in the form of {path: "...", method: "..."}');
    } else {
      var route = new Route(data, smocksInstance);
      _routes.push(route);
      return route;
    }
  },

  method: function(route, method) {
    if (route.hasVariants()) {
      // we need a new route
      var _route = this.route({ path: route.path });
      _route._method = method;
      return _route;
    } else {
      // we can repurpose the current route
      route._method = method;
      return route;
    }
  },

  variant: function(data) {
    var variant = new Variant(data, this);
    _variants[variant.id()] = variant;
    return variant;
  },

  profile: function(id, profile) {
    _profiles[id] = profile;
  },

  action: function(id, options) {
    if (!options) {
      options = id;
      id = options.id;
    } else {
      options.id = id;
    }

    _actions[id] = options;
    return this;
  },

  actions: {
    get: function() {
      return _actions;
    },
    execute: function(id, config, request) {
      var action = _actions[id];
      if (!action) {
        return false;
      } else {
        action.handler.call(smocksInstance._executionContext(request), config);
        return true;
      }
    }
  },

  profiles: {
    applyProfile: function(profile, request) {
      if (_.isString(profile)) {
        profile = _profiles[profile];
      }
      if (profile) {
        // reset the state first
        smocksInstance.state.resetRouteState(request);
        _.each(_routes, function(route) {
          route.applyProfile((route._id && profile[route._id]) || {}, request);
        });

        // FIXME we're only resetting global plugin state where we should be saving that in a profile
        smocksInstance.plugins.resetConfig(request);
        return true;
      } else {
        return false;
      }
    },

    get: function(id) {
      if (!id) {
        return _profiles;
      }
      return _profiles[id];
    }
  },

  plugin: function(data) {
    var plugin = new Plugin(data, this);
    if (plugin.plugin) {
      plugin.plugin(this);
    }
    _plugins.push(plugin);
    return this;
  },

  plugins: {
    get: function() {
      return _plugins;
    },

    resetConfig: function(request) {
      var state = smocksInstance.state.routeState(request);
      var pluginState = state._pluginState = {};
      _.each(_plugins, function(plugin) {
        var config = plugin.config();
        if (config) {
          pluginState[plugin.id()] = {};
          _.each(config, function(data, id) {
            smocksInstance.plugins.updateConfig(plugin.id(), id, data.defaultValue, request);
          }, this);
        }
      });
    },

    updateConfig: function(pluginId, id, value, request) {
      var config = smocksInstance.state.routeState(request)._pluginState;
      var pluginConfig = config[pluginId];
      if (!pluginConfig) {
        pluginConfig = {};
        config[pluginId] = pluginConfig;
      }
      pluginConfig[id] = value;
    },

    getConfig: function(request) {
      return smocksInstance.state.routeState(request)._pluginState;
    },

    getConfigValue: function(pluginId, id, request) {
      var config = smocksInstance.state.routeState(request)._pluginState[pluginId];
      return config && config[id];
    }
  },

  routes: {
    get: function(id) {
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

  variants: {
    get: function(id) {
      if (!id) {
        return _.map(_variants, function(variant) { return variant; });
      }
      return _variants[id];
    }
  },

  global: function() {
    return this;
  },

  done: function() {
    return this;
  },

  state: require('./state/static-state'),

  findRoute: function(id) {
    return _.find(_routes, function(route) {
      return route._id === id;
    });
  },

  _sanitizeOptions: function(options) {
    if (options.state) {
      if (options.state === 'session') {
        var RequestState = require('./state/cookie-state');
        options.state = new RequestState();
      }
      if (!options.state.isInitialized) {
        console.error('invalid state handler: ', options.state);
        process.exit(1);
      }
      smocksInstance.state = options.state;
      options = _.clone(options);
      delete options.state;
    }

    return options;
  },

  _sanityCheckRoutes: function() {
    var routeIndex = {};
    _.each(_routes, function(route) {
      var id = route.id();
      if (routeIndex[id]) {
        console.error('duplicate route key "' + id + '"');
        process.exit(1);
      } else {
        routeIndex[id] = true;
      }

      var variants = route.variants();
      var variantIndex = {};
      _.each(variants, function(variant) {
        id = variant.id();
        if (variantIndex[id]) {
          console.error('duplicate variant key "' + id + '" for route "' + route.id() + '"');
          process.exit(1);
        } else {
          variantIndex[id] = true;
        }
      });
    });
  },

  _executionContext: function(request, route, plugin) {
    return {
      state: function(id, value) {
        if (value !== undefined) {
          smocksInstance.state.userState(request)[id] = value;
        } else {
          return smocksInstance.state.userState(request)[id];
        }
      },
      config: function(id) {
        if (plugin) {
          return smocksInstance.plugins.getConfigValue(plugin.id(), id, request);
        }
        return route && route.getConfigValue(id, request);
      },
      option: function(id) {
        return route && route.getOptionValue(id);
      }
    };
  }
};

module.exports = smocksInstance;
