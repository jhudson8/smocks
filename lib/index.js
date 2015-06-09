var Hapi = require('hapi');
var _ = require('lodash');
var Route = require('./route-model');
var Variant = require('./variant-model');

var CONFIG = {};

var mocker = module.exports = {
  route: function(data) {
    if (_.isString(data)) {
      data = { path: data };
    }

    var route = new Route(data, mocker);
    route.id = route.id || _.uniqueId('route');
    route._method = route._method || 'GET';
    this._routes.push(route);
    return route;
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

  variant: function(id, label) {
    var variant = new Variant(this, id, label);
    this._variants[id] = variant;
    return variant;
  },

  plugin: function(plugin) {
    if (plugin.plugin) {
      plugin.plugin(this);
    }
    else if (!plugin.onRequest) {
      console.error('A plugin with no onRequest method has been applied');
    }

    this._plugins.push(plugin);
    return this;
  },

  global: function() {
    return this;
  },

  done: function() {
    return this;
  },

  state: require('./get-state'),

  config: require('./get-config'),

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

    var server = new Hapi.Server();
    server.connection({ 
        host: options.host || 'localhost', 
        port: options.port || 8000 
    });

    configServer(server);
    server.start(function(err) {
      if (err) {
        console.error(err.message);
        System.exit(1);
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
    return _.find(this._routes, function(route) {
      return route.id === id;
    });
  }
};
mocker._routes = [];
mocker._plugins = [];
mocker._variants = {};

module.exports = mocker;


function configServer(server) {
  _.each(mocker._routes, function(route) {
    if (route.hasVariants()) {
      route.ensureSelectedVariant();
      route.initConfig(mocker);

      server.route({
        method: route._method,
        path: route.path, 
        handler: function(request, reply) {
          if (mocker.state.onRequest) {
            mocker.state.onRequest(request, reply);
          }

          var pluginIndex = 0;
          function handlePlugins() {
            var plugin = mocker._plugins[pluginIndex++];
            if (plugin) {
              if (plugin.onRequest) {
                plugin.onRequest.call({
                  state: function(id, val) {
                    if (val === undefined) {
                      return mocker.state.get(request)[id];
                    } else {
                      mocker.state.get(request)[id] = val;
                    }
                  },
                  config: function(id) {
                    return route.getConfigValue(id);
                  },
                  option: function(id) {
                    return route.getOptionValue(id);
                  }
                }, request, reply, handlePlugins);
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
