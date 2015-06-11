var _ = require('lodash');
var Variant = require('./variant-model');

var Route = function(data, mocker) {
  this.mocker = mocker;
  this.selectedConfig = {};
  this.activeVariant = undefined;
  this.variants = {};
  _.extend(this, data);
};

_.extend(Route.prototype, {
  method: function(method) {
    return this.mocker.method(this, method);
  },

  variant: function(id, label) {
    this._hasVariants = true;
    var variant = new Variant(this, id, label);
    this.variants[id] = variant;
    return variant;
  },

  plugin: function(plugin) {
    return this.mocker.plugin(plugin);
  },

  respondWith: function(responder) {
    var variant = this.variant('default');
    return variant.onRequest(responder);
  },

  respondWithFile: function(fileName) {
    var variant = this.variant('default');
    return variant.withFile(fileName);
  },

  // FIXME remove ths in a later release
  onRequest: function(responder) {
    return this.respondWith(responder);
  },

  // FIXME remove this in a later release
  withFile: function(fileName) {
    return this.respondWithFile(fileName);
  },

  done: function() {
    return this.mocker;
  },

  initConfig: function(mocker) {
    var selectedConfig = this.selectedConfig;

    function setDefaultValue(key, data, selectedConfig, mocker) {
      var value = _.isFunction(data.defaultValue) ? data.defaultValue() : data.defaultValue;

      if (value !== undefined) {
        selectedConfig[key] = value;
      }
    }

    _.each(this.config(), function(data, key) {
      setDefaultValue(key, data, selectedConfig, mocker);
    });

    _.each(this.variants, function(variant, id) {
      selectedConfig = variant.selectedConfig = {};
      _.each(variant.config(), function(data, key) {
        setDefaultValue(key, data, selectedConfig, mocker);
      });
    });
  },

  ensureSelectedVariant: function() {
    if (!this.activeVariant) {
      var first;
      variant = _.find(this.variants, function(variant) {
        first = first || variant;
        return variant.id === 'default';
      });
      this.activeVariant = (variant || first).id;
    }
  },

  _handleRequest: function(request, reply) {
    var self = this;
    var mocker = this.mocker;
    var variant = this.getActiveVariant();

    if (variant) {
      return variant.responder.call({
        state: function(id, value) {
          if (value !== undefined) {
            mocker.state.get(request)[id] = value;
          } else {
            return mocker.state.get(request)[id];
          }
        },
        config: function(id) {
          return self.getConfigValue(id);
        },
        option: function(id) {
          return self.getOptionValue(id);
        }
      }, request, reply);
    } else {
      console.error('no selected handler found for ' + this.path);
      reply('no selected handler found for ' + this.path).code(500);
    }
  },

  getConfigValue: function(id) {
    if (this.selectedConfig[id] !== undefined) {
      return this.selectedConfig[id];
    }
    var variant = this.getActiveVariant();
    if (variant.selectedConfig[id]) {
      return variant.selectedConfig[id];
    }
  },

  getOptionValue: function(id) {
    return this._options && this._options[id];
  },

  start: function() {
    this.mocker.start();
  },

  config: function(config) {
    if (config) {
      this._config = config;
      return this;
    } else {
      return this._config;
    }
  },

  options: function(options) {
    if (options) {
      this._options = options;
      return this;
    } else {
      return this._options;
    }
  },

  route: function(data) {
    if (!this.isDone) {
      this.done();
    }

    return this.mocker.route(data);
  },

  global: function() {
    return this.mocker.global();
  },

  selectVariant: function(id) {
    this.activeVariant = id;
    _.each(this.variants, function(variant) {
      variant.isSelected = variant.id === id;
    });
  },

  getActiveVariant: function() {
    var id = this.activeVariant;

    if (id) {
      var match = id.match(/global:(.+)/);
      if (match) {
        return _.find(this.mocker._variants, function(variant) {
          return variant.id === match[1];
        });
      } else {
        return _.find(this.variants, function(variant) {
          return variant.id === id;
        });
      }
    }
  },

  hasVariants: function() {
    return this._hasVariants;
  }
});

module.exports = Route;
