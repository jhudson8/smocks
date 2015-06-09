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

  onRequest: function(responder) {
    this.responder = responder;
    this.done();
    return this.route;
  },

  done: function() {
    this.route.done();
  },

  global: function() {
    return this.route.global();
  }
});

module.exports = Variant;
