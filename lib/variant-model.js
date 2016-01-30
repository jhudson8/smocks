var _ = require('lodash');

var Variant = function(data, route) {
  if (_.isString(data)) {
    data = { id: data };
  }
  this._id = data.id || 'default';
  this._label = data.label;
  this.handler = data.handler;
  this._route = route;
  this._input = data.input;
  this.appliesToRoute = data.appliesToRoute;
};
_.extend(Variant.prototype, {

  id: function() {
    return this._id;
  },

  label: function(label) {
    if (label) {
      this._label = label;
      return this;
    } else {
      return this._label;
    }
  },

  input: function(input) {
    if (input) {
      this._input = input;
      return this;
    } else {
      return this._input;
    }
  },

  plugin: function(plugin) {
    return this._route.plugin(plugin);
  },

  respondWith: function(handler) {
    this.handler = handler;
    this.done();
    return this;
  },

  respondWithFile: function(fileName) {
    return this.respondWith(function(request, reply) {
      var self = this;
      fileName = fileName.replace(/\{([^\}]+)\}/g, function(match, token) {
        var val = request.params[token];
        if (!val) {
          val = self.state(token);
        }
        return val || match;
      });
      reply.file(fileName);
    });
  },

  respondWithJsonData: function(dataLocation, fileName) {
    var self = this;
    return self.createJsonResponse(self._id, self._route._path, dataLocation, fileName);
  },

  createJsonResponse: function(variant, path, dataLocation, fileName) {
    return this.respondWith(function(request, reply) {
      var pattern = /{\w+}\/*/g;
      path = path.replace(pattern, '');
      var executingDir = require('path').dirname(require.main.filename);
      var dataFilePath = executingDir + '/' + dataLocation + path + variant + '/' + fileName;
      var response = require(dataFilePath);

      reply(response);
    });
  },

  variant: function() {
    return this._route.variant.apply(this._route, arguments);
  },

  route: function() {
    return this._route.route.apply(this._route, arguments);
  },

  start: function() {
    return this._route.start.apply(this._route, arguments);
  },

  toHapiPlugin: function() {
    return this._route.toHapiPlugin.apply(this._mocker, arguments);
  },

  done: function() {
    this._route.done();
  },

  global: function() {
    return this._route.global();
  }
});

module.exports = Variant;
