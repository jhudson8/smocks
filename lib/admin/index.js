var formatData = require('./api/format-data');
var fs = require('fs');
var _ = require('lodash');

module.exports = function(server, mocker) {

  server.route({
    method: 'GET',
    path: '/_admin',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      fs.readFile(__dirname + '/config-page.html', {encoding: 'utf8'}, function(err, html) {
        if (err) {
          console.error(err);
          reply(err);
        } else {
          var data = formatData(mocker, request);
          html = html.replace('{data}', JSON.stringify(data));
          reply(html);
        }
      });
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/route/{id}/variant',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/route-variant')(route, mocker)(request, reply);
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/action',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/execute-action')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/route/{routeId}/variant/{variantId}',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      var routeId = request.params.routeId;
      var route = mocker.findRoute(routeId);
      var variantId = request.params.variantId;

      route.selectVariant(variantId, request);
      reply(formatData(mocker, request));
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/route/{id}/config',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/route-config')(route, mocker)(request, reply);
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/state/reset',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/reset-state')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/global/config/{pluginId}',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/global-config')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'GET',
    path: '/_admin/api/profile',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/calculate-profile')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/profile',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/select-local-profile')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/profile/{name}',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/select-remote-profile')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'PUT',
    path: '/_admin/api/profile/{name}',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/select-remote-profile')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'GET',
    path: '/_admin/lib/{name}',
    handler: function(request, reply) {
      reply.file(__dirname + '/lib/' + request.params.name);
    }
  });

  server.route({
    method: 'GET',
    path: '/_admin/app.js',
    handler: function(request, reply) {
      reply.file(__dirname + '/config-page.js');
    }
  });

  server.route({
    method: 'GET',
    path: '/_admin/inputs.js',
    handler: function(request, reply) {
      reply(getConfigInputs(mocker));
    }
  });

  function ensureInitialized(func) {
    return function(request, reply) {
      if (!mocker.state.isInitialized(request)) {
        _.each(mocker.routes.get(), function(route) {
          route.resetRouteSettings(request);
          route.resetSelectedConfig(request);
        });
        mocker.plugins.resetConfig(request);
        mocker.state.onInitialized && mocker.state.onInitialized(request);
      }

      func.call(this, request, reply);
    }
  }

  function wrapReply(request, reply) {
    var rtn = function(payload) {
      var response = reply.call(this, payload).hold();
      if (mocker.state.onResponse) {
        mocker.state.onResponse(request, response);
      }
      return response.send();
    }
    rtn.file = function() {
      var response = reply.file.apply(reply, arguments).hold();
      if (mocker.state.onResponse) {
        mocker.state.onResponse(request, response);
      }
      return response.send();
    }
    return rtn;
  }
};

function getConfigInputs(mocker) {
  var inputs = mocker.inputs.get();
  var script = '';
  _.each(inputs, function(data, id) {
    script = script + 'config["' + id + '"] = ' + data.ui + '\n';
  });
  script = 'var _inputs = function(config) {\n' + script + '\n};';
  return script;
}
