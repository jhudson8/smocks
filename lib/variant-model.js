var _ = require('lodash');
var Fs = require('fs');
var Path = require('path');

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
    var self = this;

    return this.respondWith(function(request, reply) {
      // Intentionally requiring smocks to lazy load options
      var smocks = require('./index');

      options = _.extend({
        fileName: smocks.initOptions.fileName || 'default.json',
        mockDir: smocks.initOptions.mockDir || './mocked-data',
        statusCode: smocks.initOptions.statusCode || 200
      }, options);

      var pattern = /[{}}]\/*/g;
      var path = self._route.path().replace(pattern, '');
      var httpMethod = self._route.method();
      var dataFilePath = Path.join(options.mockDir, path, httpMethod, self.id() + '.json');

      // Search for variant file
      Fs.readFile(dataFilePath, function (err, data) {
        if (err) {
          console.error('Mocking data file not found: ' + dataFilePath);
          return reply().code(404);
        } else {
          reply(data).type('application/json').code(options.statusCode);
        }
      });
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
