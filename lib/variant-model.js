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

  respondWithFile: function(options) {
    // initOptions is initialized first after hapi.js is
    // started, we need a way to initialize them before we
    // load the endpoints.js
    var smocks = require('./index');

    options = _.extend({
      // keeping response.json for making it easier for the user
      // to add response files, let's discuss more in this
      fileName: smocks.initOptions.fileName || 'response.json',
      mockDir: smocks.initOptions.mockDir || './mocked-data',
      statusCode: smocks.initOptions.statusCode || 200
    }, options);

    return this.respondWith(function(request, reply) {
      var pattern = /{\w+}\/*/g;
      path = this._route.path.replace(pattern, '');
      var dataFilePath = options.mockDir + path + this.id() + '/' + options.fileName;
      reply.file(dataFilePath).code(options.statusCode);
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
