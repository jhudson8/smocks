var _ = require('lodash');

var Variant = function(route, id, label) {
  this.route = route;
  this.id = id;
  this.label = label;
};
_.extend(Variant.prototype, {

  config: function(config) {
    if (config) {
      this._config = config;
      return this;
    } else {
      return this._config;
    }
  },

  plugin: function(plugin) {
    return this.route.plugin(plugin);
  },

  onRequest: function(responder) {
    this.responder = responder;
    this.done();
    return this.route;
  },

  withFile: function(fileName) {
    return this.onRequest(function(request, reply) {
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

  done: function() {
    this.route.done();
  },

  global: function() {
    return this.route.global();
  }
});

module.exports = Variant;
