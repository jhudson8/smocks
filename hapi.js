/**
 * Exposes HAPI integration for the mock server
 */
var smocks = require('./lib');
var Hapi = require('hapi');
var _ = require('lodash');
var _inputs = {
  boolean: require('./lib/admin/api/config-plugins/checkbox'),
  text: require('./lib/admin/api/config-plugins/text'),
  select: require('./lib/admin/api/config-plugins/select'),
  multiselect: require('./lib/admin/api/config-plugins/multiselect')
};


module.exports = {
  toPlugin: function(options) {
    if (options.options) {
      smocks.initOptions = options.options;
      delete options.options;
    }

    smocks._sanityCheckRoutes();
    options = smocks._sanitizeOptions(options);

    var register = function (server, _options, next) {
      if (options.onRegister) {
        options.onRegister(server, _options);
        delete options.onInitialize;
      }

      configServer(server);
      return next();
    };
    return register;
  },

  start: function(options) {
    if (!smocks.id()) {
      throw new Error('You must set an id value for the smocks instance... smocks.id("my-project")');
    }
    if (options.options) {
      smocks.initOptions = options.options;
      delete options.options;
    }

    smocks._sanityCheckRoutes();
    options = smocks._sanitizeOptions(options);

    var cors = options.cors || true;
    delete options.cors;

    var server = new Hapi.Server({
      connections: {
        routes: {
          cors: cors
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
    console.log('started smocks server on ' + options.port + '.  visit http://localhost:' + options.port + '/_admin to configure');

    return {
      server: server,
      start: function(options) {
        self.start(options);
      }
    };
  }
};


function wrapReply(request, reply, plugins) {
  var rtn = function() {
    var response = reply.apply(this, arguments);
    if (smocks.state.onResponse) {
      smocks.state.onResponse(request, response);
    }
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
  // set the input types on the smocks object
  smocks.input = function(type, options) {
    _inputs[type] = options;
  };
  smocks.inputs = {
    get: function() {
      return _inputs;
    }
  };

  var _routes = smocks.routes.get();
  var _plugins = smocks.plugins.get();

  _.each(_routes, function(route) {
    if (route.hasVariants()) {
      server.route({
        method: route.method(),
        path: route.path(), 
        handler: function(request, reply) {
          reply = wrapReply(request, reply, _plugins);

          if (!smocks.state.isInitialized(request)) {
            _.each(_routes, function(route) {
              route.resetRouteVariant(request);
              route.resetSelectedConfig(request);
            });
            smocks.plugins.resetConfig(request);
            smocks.state.onInitialized && smocks.state.onInitialized(request);
          }

          if (smocks.state.onRequest) {
            smocks.state.onRequest(request, reply);
          }

          var pluginIndex = 0;
          function handlePlugins() {
            var plugin = _plugins[pluginIndex++];
            if (plugin) {
              if (plugin.onRequest) {
                plugin.onRequest.call(smocks._executionContext(request, route, plugin), request, reply, handlePlugins);
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

  require('./lib/admin')(server, smocks);
}
