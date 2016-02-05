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
    options = _.extend({
      variant_id: this.id(),
      path: this._route.path(),
    }, options);

    return this.respondWith(function(request, reply) {
      var smocks = require('./index');

      options = _.extend({
        fileName: smocks.initOptions.fileName || 'response.json',
        mockDir: smocks.initOptions.mockDir || './mocked-data',
        statusCode: smocks.initOptions.statusCode || 200
      }, options);

      if(options.statusCode == 200) {
        var pattern = /{\w+}\/*/g;
        var path = options.path.replace(pattern, '');
        var dataVariantFilePath = Path.join(options.mockDir, path, options.variant_id, options.fileName);

        // Search variant directory
        Fs.stat(dataVariantFilePath, function (err) {
          if (err) {
            // Search parent directory
            var dataCommonFilePath = Path.join(options.mockDir, path, options.fileName);
            Fs.stat(dataCommonFilePath, function (err) {
              if(err) {
                console.error('Mocking data file not found: ' + dataVariantFilePath);
                reply().code(404);
              } else {
                reply.file(dataCommonFilePath);
              }
            });
          } else {
            reply.file(dataVariantFilePath);
          }
        });
      } else {
        // Reply with status code only
        reply().code(options.statusCode);
      }
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
