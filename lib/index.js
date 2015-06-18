var Hapi = require('hapi');
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
var _inputs = {
  checkbox: require('./admin/api/config-plugins/checkbox'),
  text: require('./admin/api/config-plugins/text'),
  select: require('./admin/api/config-plugins/select'),
  multiselect: require('./admin/api/config-plugins/multiselect')
};

var mocker = module.exports = {
  route: function(data) {
    if (!data.path) {
      console.error('Routes must be in the form of {path: "...", method: "..."}');
    } else {
      var route = new Route(data, mocker);
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

  input: function(type, options) {
    _inputs[type] = options;
  },

  inputs: {
    get: function() {
      return _inputs;
    }
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
        action.handler.call(executionContext(request), config);
        return true;
      }
    }
  },

  profiles: {
    apply: function(profile, request) {
      if (_.isString(profile)) {
        profile = _profiles[profile];
      }
      if (profile) {
        // reset the state first
        mocker.state.reset(request);
        _.each(_routes, function(route) {
          route.applyProfile((route._id && profile[route._id]) || {}, request);
        });
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

    var config = plugin.config();
    if (config) {
      _.each(config, function(data, id) {
        this.plugins.updateConfig(plugin.id(), id, data.defaultValue);
      }, this);
    }

    return this;
  },

  plugins: {
    get: function() {
      return _plugins;
    },

    updateConfig: function(pluginId, id, value) {
      var config = this.globalConfigValues = this.globalConfigValues || {};
      var pluginConfig = config[pluginId];
      if (!pluginConfig) {
        pluginConfig = {};
        config[pluginId] = pluginConfig;
      }
      pluginConfig[id] = value;
    },

    getConfigValue: function(pluginId, id) {
      var config = this.globalConfigValues = this.globalConfigValues || {};
      var pluginConfig = config[pluginId];
      return pluginConfig && pluginConfig[id];
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

  state: require('./get-state'),

  start: function(options) {
    options = options || {};

    var self = this;

    if (options.route) {
      // we are a hapi server
      configServer(options);
      return {
        server: options,
        start: function(options) {
          self.start(options);
        }
      };
    }

    var server = new Hapi.Server({
      connections: {
        routes: {
          cors: true
        }
      }
    });
    server.connection(options);

    configServer(server);
    server.start(function(err) {
      if (err) {
        console.error(err.message);
        process.exit(1);
      }
    });
    console.log('started');

    return {
      server: server,
      start: function(options) {
        self.start(options);
      }
    };
  },

  findRoute: function(id) {
    return _.find(_routes, function(route) {
      return route._id === id;
    });
  }
};

module.exports = mocker;


function wrapReply(request, reply, plugins) {
  var rtn = function() {
    var response = reply.apply(this, arguments);
    _.each(plugins, function(plugin) {
      if (plugin.onResponse) {
        plugin.onResponse(request, response);
      }
    });
    return response;
  };
  _.each(['continue', 'file', 'view', 'close', 'proxy', 'redirect'], function(key) {
    rtn[key] = function() {
      reply[key].apply(reply, arguments);
    };
  });
  return rtn;
}


function configServer(server) {
  _.each(_routes, function(route) {
    if (route.hasVariants()) {
      route.initConfig(mocker);

      server.route({
        method: route.method(),
        path: route.path(), 
        handler: function(request, reply) {
          reply = wrapReply(request, reply, _plugins);

          if (mocker.state.onRequest) {
            mocker.state.onRequest(request, reply);
          }

          var pluginIndex = 0;
          function handlePlugins() {
            var plugin = _plugins[pluginIndex++];
            if (plugin) {
              if (plugin.onRequest) {
                plugin.onRequest.call(executionContext(request, route), request, reply, handlePlugins);
              } else {
                handlePlugins();
              }
            } else {
              route._handleRequest.call(route, request, reply);
            }
          }

          handlePlugins();
        }
      });
    }
  }, this);

  require('./admin')(server, mocker);
}

function executionContext(request, route) {
  return {
    state: function(id, value) {
      if (value !== undefined) {
        mocker.state.get(request)[id] = value;
      } else {
        return mocker.state.get(request)[id];
      }
    },
    config: function(id) {
      return route && route.getConfigValue(id);
    },
    option: function(id) {
      return route && route.getOptionValue(id);
    }
  };
}
