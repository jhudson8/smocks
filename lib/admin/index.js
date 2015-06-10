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
    method: 'GET',
    path: '/_admin/lib/{name}',
    handler: function(request, reply) {
      reply.file('./lib/admin/lib/' + request.params.name);
    }
  });
};
