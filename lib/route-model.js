var _ = require('lodash');
var Variant = require('./variant-model');

var Route = function(data, mocker) {
  this._mocker = mocker;
  this._path = data.path;
  this._method = data.method || 'GET';
  this._id = data.id || this._method + ':' + this._path;

  this._selectedConfig = {};
  this._activeVariant = undefined;
  this._variants = {};

  if (data.handler) {
    this.variant(data.handler);
  }
};

_.extend(Route.prototype, {
  id: function() {
    return this._id;
  },

  method: function() {
    return this._method;
  },

  path: function() {
    return this._path;
  },

  label: function(label) {
    if (!label) {
      return this._label;
    }
    this._label = label;
    return this;
  },

  applyProfile: function(profile) {
    this._selectedConfig = {};
    this.initConfig(this._mocker);
    this._activeVariant = profile.activeVariant;
    _.extend(this._selectedConfig, profile.selections && profile.selections.route);
    _.each(this._variants, function(variant, id) {
      variant.selectedConfig(profile.selections && profile.selections.variants && profile.selections.variants[id] || {});
    }, this);
  },

  variant: function(data) {
    var variant = new Variant(data, this);
    this._variants[variant.id()] = variant;

    if (!this._hasVariants) {
      this._hasVariants = true;
      this._activeVariant = variant.id();
    }

    return variant;
  },

  variants: function() {
    return this._variants;
  },

  plugin: function(plugin) {
    return this._mocker.plugin(plugin);
  },

  respondWith: function(responder) {
    var variant = this.variant('default');
    return variant.respondWith(responder);
  },

  respondWithFile: function(fileName) {
    var variant = this.variant('default');
    return variant.withFile(fileName);
  },

  activeVariant: function() {
    return this._activeVariant;
  },

  done: function() {
    return this._mocker;
  },

  initConfig: function(mocker) {
    var selectedConfig = this._selectedConfig;

    function setDefaultValue(key, data, selectedConfig, mocker) {
      var value = _.isFunction(data.defaultValue) ? data.defaultValue() : data.defaultValue;

      if (value !== undefined) {
        selectedConfig[key] = value;
      }
    }

    _.each(this.config(), function(data, key) {
      setDefaultValue(key, data, selectedConfig, mocker);
    });

    _.each(this._variants, function(variant, id) {
      selectedConfig = variant.selectedConfig({});
      _.each(variant.config(), function(data, key) {
        setDefaultValue(key, data, selectedConfig, mocker);
      });
    });
  },

  _handleRequest: function(request, reply) {
    var self = this;
    var mocker = this._mocker;
    var variant = this.getActiveVariant();

    if (variant) {
      if (variant.handler) {
        return variant.handler.call(executionContext(this, request), request, reply);
      } else {
        console.error('no variant handler found for ' + this.path + ':' + variant.id());
        reply('no variant handler found for ' + this.path + ':' + variant.id()).code(500);
      }
    } else {
      console.error('no selected handler found for ' + this.path);
      reply('no selected handler found for ' + this.path).code(500);
    }
  },

  getConfigValue: function(id) {
    if (this._selectedConfig[id] !== undefined) {
      return this._selectedConfig[id];
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
    this._mocker.start();
  },

  config: function(config) {
    if (config) {
      this._config = config;
      return this;
    } else {
      return this._config;
    }
  },

  selectedConfig: function() {
    return this._selectedConfig;
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

    return this._mocker.route(data);
  },

  global: function() {
    return this._mocker.global();
  },

  selectVariant: function(id, request) {
    this._activeVariant = id;
    _.each(this._variants, function(variant) {
      if (variant.id() === id && variant.onActivate) {
        variant.onActivate.call(executionContext(this, request));
      }
    });
  },

  getActiveVariant: function() {
    var id = this._activeVariant;

    if (id) {
      var match = id.match(/global:(.+)/);
      if (match) {
        return _.find(this._mocker._variants, function(variant) {
          return variant.id() === match[1];
        });
      } else {
        return _.find(this._variants, function(variant) {
          return variant.id() === id;
        });
      }
    }
  },

  hasVariants: function() {
    return this._hasVariants;
  }
});

module.exports = Route;

function executionContext(route, request) {
  return {
    state: function(id, value) {
      if (value !== undefined) {
        route._mocker.state.get(request)[id] = value;
      } else {
        return route._mocker.state.get(request)[id];
      }
    },
    config: function(id) {
      return route.getConfigValue(id);
    },
    option: function(id) {
      return route.getOptionValue(id);
    }
  };
}
