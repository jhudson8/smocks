var formatData = require('./api/format-data');

module.exports = function(server, mocker) {

  server.route({
    method: 'GET',
    path: '/_admin',
    handler: require('./config-page')(mocker)
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/route/{id}/variant',
    handler: function(request, reply) {
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/route-variant')(route, mocker)(request, reply);
    }
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/route/{routeId}/variant/{variantId}',
    handler: function(request, reply) {
      var routeId = request.params.routeId;
      var route = mocker.findRoute(routeId);
      var variantId = request.params.variantId;

      route.selectVariant(variantId, request);
      reply(formatData(mocker, request));
    }
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/route/{id}/config',
    handler: function(request, reply) {
      var id = request.params.id;
      var route = mocker.findRoute(id);

      require('./api/route-config')(route, mocker)(request, reply);
    }
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/state/reset',
    handler: function(request, reply) {
      require('./api/reset-state')(mocker)(request, reply);
    }
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/global/config/{pluginId}',
    handler: function(request, reply) {
      require('./api/global-config')(mocker)(request, reply);
    }
  });

  server.route({
    method: 'GET',
    path: '/_admin/api/profile',
    handler: function(request, reply) {
      require('./api/calculate-profile')(mocker)(request, reply);
    }
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/profile',
    handler: function(request, reply) {
      require('./api/select-local-profile')(mocker)(request, reply);
    }
  });

  server.route({
    method: 'POST',
    path: '/_admin/api/profile/{name}',
    handler: function(request, reply) {
      require('./api/select-remote-profile')(mocker)(request, reply);
    }
  });

  server.route({
    method: 'PUT',
    path: '/_admin/api/profile/{name}',
    handler: function(request, reply) {
      require('./api/select-remote-profile')(mocker)(request, reply);
    }
  });

  server.route({
    method: 'GET',
    path: '/_admin/lib/{name}',
    handler: function(request, reply) {
      reply.file(__dirname + '/lib/' + request.params.name);
    }
  });
};
