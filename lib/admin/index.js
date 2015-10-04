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
    path: '/_admin/api/route/{id}',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/route-update')(route, mocker)(request, reply);
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
    path: '/_admin/api/state/reset',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/reset-state')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/config/reset',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/reset-config')(mocker)(request, reply);
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
    path: '/_admin/api/har',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/get-har')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/har',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/set-har')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'PATCH',
    path: '/_admin/api/har',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/update-har')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'DELETE',
    path: '/_admin/api/har',
    handler: ensureInitialized(function(request, reply) {
      reply = wrapReply(request, reply);
      require('./api/remove-har')(mocker)(request, reply);
    })
  });

  server.route({
    method: 'GET',
    path: '/_admin/lib/{name*}',
    handler: function(request, reply) {
      fs.readFile(__dirname + '/lib/' + request.params.name, reply);
    }
  });

  var compiledSource;
  server.route({
    method: 'GET',
    path: '/_admin/app.js',
    handler: function(request, reply) {
      if (!compiledSource) {
        var source = fs.readFileSync(__dirname + '/config-page.js', {encoding: 'utf-8'});
        compiledSource = require('babel').transform(source).code;
      }
      reply(compiledSource);
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
          route.resetRouteVariant(request);
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
