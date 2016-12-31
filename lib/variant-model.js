var _ = require('lodash');
var mimeTypes = require('mime-types');
var fs = require('fs');
var Path = require('path');

var Variant = function (data, route) {
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

  id: function () {
    return this._id;
  },

  label: function (label) {
    if (label) {
      this._label = label;
      return this;
    } else {
      return this._label;
    }
  },

  input: function (input) {
    if (input) {
      this._input = input;
      return this;
    } else {
      return this._input;
    }
  },

  plugin: function (plugin) {
    return this._route.plugin(plugin);
  },

  respondWith: function (handler) {
    this.handler = handler;
    this.done();
    return this;
  },

  respondWithFile: function (options) {
    var self = this;
    return this.respondWith(function (request, reply) {
      options = options || {};
      if (_.isString(options)) {
        options = {
          path: options
        };
      }
      if (options.path) {
        var path = Path.resolve(options.path.replace(/\{([^\}]+)\}/g, function (match, token) {
          var val = request.params[token];
          if (!val) {
            val = self.state(token);
          }
          return val || match;
        }));
        // a specific file name was provided
        fs.readFile(path, function (err, stream) {
          if (err) {
            if (err.code === 'ENOENT') {
              // doesn't exist
              return reply(path + ' not found').code(404);
            } else {
              return reply(err);
            }
          }
          var mimeType = mimeTypes.lookup(path);
          reply(stream).type(mimeType).code(options.code || 200);
        });
      } else {
        // a specific handler must be provided
        var initOptions = require('./index').options;
        var handlerFunction = initOptions.respondWithFileHandler;
        if (!handlerFunction) {
          return reply({
            message: 'no file handler function (use smocks "replyWithFileHandler" option)'
          }).code(500);
        }
        handlerfunction ({
          request: request,
          reply: reply,
          route: self._route,
          variant: self,
          options: options,
          smocksOptions: initOptions
        });
      }
    });


    return this.respondWith(function (request, reply) {
      var self = this;
      fileName = fileName.replace(/\{([^\}]+)\}/g, function (match, token) {
        var val = request.params[token];
        if (!val) {
          val = self.state(token);
        }
        return val || match;
      });
      reply.file(fileName);
    });
  },

  variant: function () {
    return this._route.variant.apply(this._route, arguments);
  },

  route: function () {
    return this._route.route.apply(this._route, arguments);
  }
});

module.exports = Variant;
