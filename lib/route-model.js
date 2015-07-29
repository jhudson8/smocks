var _ = require('lodash');
var Variant = require('./variant-model');

var Route = function(data, mocker) {
  this._mocker = mocker;
  this._label = data.label;
  this._path = data.path;
  this._method = data.method || 'GET';
  this._id = data.id || this._method + ':' + this._path;

  this._config = data.config;
  this._options = data.options;
  this._variants = {};
  this._actions = data.actions || {};
  this._display = data.display;

  if (data.handler) {
    this.variant({
      id: 'default',
      handler: data.handler
    });
  }

  if (data.actions) {
    this._actions = data.actions;
  }

  var self = this;
  this.actions = {
    get: function() {
      return self._actions;
    },
    execute: function(id, config, request) {
      var action = self._actions[id];
      if (!action) {
        return null;
      } else {
        return action.handler.call(executionContext(self, request), config);
      }
    }
  };
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

  action: function(id, options) {
    if (!options) {
      options = id;
      id = options.id;
    } else {
      options.id = id;
    }

    this._actions[id] = options;
    return this;
  },

  display: function(displayFunc) {
    if (!displayFunc) {
      return this._display;
    } else {
      this._display = displayFunc;
      return this;
    }
  },

  getDisplayValue: function(request) {
    if (this._display) {
      return this._display.call(executionContext(this, request));
    }
  },

  label: function(label) {
    if (!label) {
      return this._label;
    }
    this._label = label;
    return this;
  },

  applyProfile: function(profile, request) {
    // set the default config and then we'll override
    this.resetRouteSettings(request);
    this.resetSelectedConfig(request);

    this.selectVariant(profile.activeVariant, request);
    var routeConfig = this.selectedRouteConfig(request);

    var selectedRouteConfig = this.selectedRouteConfig(request);
    _.extend(selectedRouteConfig, profile.selections && profile.selections.route);

    _.each(this.variants(), function(variant) {
      var selectedVariantConfig = this.selectedVariantConfig(variant.id(), request);
      var selections = profile.selections && profile.selections.variants && profile.selections.variants[variant.id()];
      if (selections) {
        _.extend(selectedVariantConfig, selections);
      }
    }, this);
  },

  variant: function(data) {
    var variant = new Variant(data, this);
    this._variants[variant.id()] = variant;

    if (!this._hasVariants) {
      this._hasVariants = true;
    }

    return variant;
  },

  variants: function() {
    var rtn = [];
    var index = {};
    _.each(this._variants, function(variant) {
      rtn.push(variant);
      index[variant.id()] = true;
    });
    _.each(this._mocker.variants.get(), function(variant) {
      if (!index[variant.id()]) {
        if (!variant.appliesToRoute || variant.appliesToRoute(this)) {
          rtn.push(variant);
        }
      }
    }, this);
    return rtn;
  },

  selectVariant: function(id, request) {
    var match = false;
    _.each(this._variants, function(variant) {
      if (variant.id() === id) {
        match = true;
        variant.onActivate && variant.onActivate.call(executionContext(this, request));
      }
    });
    if (!match) {
      _.each(this._mocker.variants.get(), function(variant) {
        if (variant.id() === id) {
          match = true;
          variant.onActivate && variant.onActivate.call(executionContext(this, request), this);
        }
      }, this);
    }

    if (match) {
      this._mocker.state.routeState(request)[this._id]._activeVariant = id;
    }
  },

  getActiveVariant: function(request) {
    var id = this.activeVariant(request);
    return _.find(this.variants(), function(variant) {
      return variant.id() === id;
    });
  },

  hasVariants: function() {
    return this._hasVariants;
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

  activeVariant: function(request) {
    return this._mocker.state.routeState(request)[this._id]._activeVariant;
  },

  done: function() {
    return this._mocker;
  },

  config: function(config) {
    if (config) {
      this._config = config;
      return this;
    } else {
      return this._config;
    }
  },

  // reset selected route variant
  resetRouteSettings: function(request) {
    var routeState = this._mocker.state.routeState(request)[this.id()] = {};
    var variants = this.variants();
    for (var i=0; i<variants.length; i++) {
      routeState._activeVariant = variants[i].id();
      break;
    }
  },

  resetSelectedConfig: function(request) {
    var rootConfig = this._mocker.state.routeState(request)[this.id()];
    if (!rootConfig) {
      this._mocker.state.routeState(request)[this.id()] = {};
      rootConfig = this._mocker.state.routeState(request)[this.id()];
    }
    rootConfig._config = {};
    rootConfig._variantConfig = {};

    var selectedRouteConfig = this.selectedRouteConfig(request);

    function setDefaultValue(key, data, obj) {
      var value = _.isFunction(data.defaultValue) ? data.defaultValue() : data.defaultValue;
      if (value !== undefined) {
        obj[key] = value;
      }
    }

    _.each(this.config(), function(data, key) {
      setDefaultValue(key, data, selectedRouteConfig);
    }, this);

    _.each(this.variants(), function(variant) {
      this.selectVariantConfig({}, variant, request);
      var selectedVariantConfig = this.selectedVariantConfig(variant, request);
      _.each(variant.config(), function(data, key) {
        setDefaultValue(key, data, selectedVariantConfig);
      }, this);
    }, this);
  },

  selectRouteConfig: function(selectedConfig, request) {
    var config = this._mocker.state.routeState(request);
    config[this.id()]._config = selectedConfig || {};
    return this;
  },

  selectedRouteConfig: function(request) {
    var config = this._mocker.state.routeState(request);
    return config[this.id()]._config;
  },

  getConfigValue: function(id, request) {
    var routeConfig = this.selectedRouteConfig(request);
    if (!_.isUndefined(routeConfig[id])) {
      return routeConfig[id];
    }

    var variant = this.getActiveVariant(request);
    var variantConfig = this.selectedVariantConfig(variant, request);
    return variantConfig[variant.id()][id];
  },

  selectedVariantConfig: function(variant, request) {
    var rootConfig = this._mocker.state.routeState(request)[this.id()];
    if (!rootConfig) {
      rootConfig = this._mocker.state.routeState(request)[this.id()];
    }
    return rootConfig._variantConfig;
  },

  selectVariantConfig: function(selectedConfig, variant, request) {
    var config = this._mocker.state.routeState(request)[this.id()];
    config._variantConfig[variant.id()] = selectedConfig;
  },

  getOptionValue: function(id) {
    return this._options && this._options[id];
  },

  start: function() {
    this._mocker.start.apply(this._mocker, arguments);
  },

  toHapiPlugin: function() {
    return this._mocker.toHapiPlugin.apply(this._mocker, arguments);
  },

  _handleRequest: function(request, reply) {
    var self = this;
    var mocker = this._mocker;
    var variant = this.getActiveVariant(request);

    if (variant) {
      if (variant.handler) {
        return variant.handler.call(executionContext(this, request), request, reply);
      } else {
        console.error('no variant handler found for ' + this._path + ':' + variant.id());
        reply('no variant handler found for ' + this._path + ':' + variant.id()).code(500);
      }
    } else {
      console.error('no selected handler found for ' + this._path);
      reply('no selected handler found for ' + this.path).code(500);
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

    return this._mocker.route(data);
  },

  global: function() {
    return this._mocker.global();
  }
});

module.exports = Route;

function executionContext(route, request) {
  return {
    state: function(id, value) {
      if (value !== undefined) {
        route._mocker.state.userState(request)[id] = value;
      } else {
        return route._mocker.state.userState(request)[id];
      }
    },
    config: function(id) {
      return route.getConfigValue(id, request);
    },
    option: function(id) {
      return route.getOptionValue(id);
    }
  };
}
