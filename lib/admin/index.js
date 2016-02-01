var formatData = require('./api/format-data');
var fs = require('fs');
var Path = require('path');
var _ = require('lodash');
var MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ttf': 'font/ttf',
  '.eot': 'font/eot',
  '.otf': 'font/otf',
  '.woff': 'font/woff'
};

module.exports = function(server, mocker) {

  var connection = server;

  if (mocker.connection()) {
    connection = server.select(mocker.connection());
  }


  connection.route({
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

  connection.route({
    method: 'POST',
    path: '/_admin/api/route/{id}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/route-update')(route, mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: '/_admin/api/action',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/execute-action')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: '/_admin/api/state/reset',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/reset-state')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: '/_admin/api/input/reset',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/reset-input')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: '/_admin/api/global/input/{pluginId}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/global-input')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'GET',
    path: '/_admin/api/profile',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/calculate-profile')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: '/_admin/api/profile',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/select-local-profile')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: '/_admin/api/profile/{name}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/select-remote-profile')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'PUT',
    path: '/_admin/api/profile/{name}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/select-remote-profile')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: '/_admin/api/proxy',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/set-proxy')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'GET',
    path: '/_admin/api/har',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/get-har')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'POST',
    path: '/_admin/api/har',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/set-har')(mocker)(request, reply, respondWithConfig);
    }),
    config: {
      payload: {
        maxBytes: 41943040
      }
    }
  });

  connection.route({
    method: 'PATCH',
    path: '/_admin/api/har',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/update-har')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'DELETE',
    path: '/_admin/api/har',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/remove-har')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'GET',
    path: '/_admin/api/har/{id}',
    handler: ensureInitialized(function(request, reply, respondWithConfig) {
      reply = wrapReply(request, reply);
      require('./api/har-display')(mocker)(request, reply, respondWithConfig);
    })
  });

  connection.route({
    method: 'GET',
    path: '/_admin/lib/{name*}',
    handler: function(request, reply) {
      try {
        var buffer = fs.readFileSync(__dirname + '/lib/' + request.params.name);
        var ext = Path.extname(request.params.name);
        reply(buffer)
          .header('Content-Type', MIME_TYPES[ext])
          .header('Cache-Control', 'max-age=31556926');
      } catch (e) {
        reply().code(404);
      }
    }
  });

  var compiledSource;
  connection.route({
    method: 'GET',
    path: '/_admin/app.js',
    handler: function(request, reply) {
      if (!compiledSource) {
        var source = fs.readFileSync(__dirname + '/config-page.js', {encoding: 'utf-8'});
        compiledSource = require('babel').transform(source).code;
      }
      reply(compiledSource);

      // when developing config page, uncomment below
      // compiledSource = undefined;
    }
  });

  connection.route({
    method: 'GET',
    path: '/_admin/inputs.js',
    handler: function(request, reply) {
      reply(getInputPlugins(mocker));
    }
  });

  function ensureInitialized(func) {
    return function(request, reply) {

      function doInit () {
        _.each(mocker.routes.get(), function(route) {
          route.resetRouteVariant(request);
          route.resetSelectedInput(request);
        });
        mocker.plugins.resetInput(request);
        var initialState = JSON.parse(JSON.stringify(mocker.initOptions.initialState || {}));
        mocker.state.resetUserState(request, initialState)
      }

      mocker.state.initialize(request, function (err, performInitialization) {
        if (performInitialization) {
          doInit();
        }
        var returnConfig = request.query.returnConfig;
        func.call(this, request, reply, !!returnConfig);
      });
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

function getInputPlugins(mocker) {
  var inputs = mocker.inputs.get();
  var script = '';
  _.each(inputs, function(data, id) {
    script = script + 'input["' + id + '"] = ' + data.ui + '\n';
  });
  script = 'var _inputs = function(input) {\n' + script + '\n};';
  return script;
}
