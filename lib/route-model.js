var _ = require('lodash');
var Variant = require('./variant-model');

var Route = function(data, mocker) {
  this._mocker = mocker;
  this._label = data.label;
  this._path = data.path;
  this._method = data.method || 'GET';
  this._group = data.group;
  this._id = data.id || this._method + ':' + this._path;

  this._config = data.config;
  this._connection = data.connection;
  this._input = data.input;
  this._meta = data.meta;
  this._variants = {};
  this._orderedVariants = [];
  this._actions = data.actions || {};
  this._display = data.display;

  if (data.handler) {
    this.variant({
      id: 'default',
      label: data.variantLabel,
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
    execute: function(id, input, request) {
      var action = self._actions[id];
      if (!action) {
        return null;
      } else {
        return action.handler.call(executionContext(self, request), input);
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

  group: function() {
    return this._group;
  },

  connection: function() {
    return this._connection;
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
    // set the default input and then we'll override
    this.resetRouteVariant(request);
    this.resetSelectedInput(request);

    this.selectVariant(profile.activeVariant, request);
    var routeInput = this.selectedRouteInput(request);

    var selectedRouteInput = this.selectedRouteInput(request);
    _.extend(selectedRouteInput, profile.selections && profile.selections.route);

    _.each(this.variants(), function(variant) {
      var selectedVariantInput = this.selectedVariantInput(variant, request);
      var selections = profile.selections && profile.selections.variants && profile.selections.variants[variant.id()];
      if (selections) {
        _.extend(selectedVariantInput, selections);
      }
    }, this);
  },

  variant: function(data) {
    var variant = new Variant(data, this);
    this._variants[variant.id()] = variant;
    this._orderedVariants.push(variant);

    if (!this._hasVariants) {
      this._hasVariants = true;
    }

    return variant;
  },

  variants: function() {
    var rtn = [];
    var index = {};
    _.each(this._orderedVariants, function(variant) {
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

  getVariant: function(id) {
    var rtn = this._variants[id];
    if (rtn) {
      return rtn;
    }
    return this._mocker.variants.get(id);
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
    } else {
      return new Error("no variants found with id : " + id);
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

  respondWithFile: function(options) {
    var variant = this.variant('default');
    return variant.respondWithFile(options);
  },

  activeVariant: function(request) {
    return this._mocker.state.routeState(request)[this._id]._activeVariant;
  },

  done: function() {
    return this._mocker;
  },

  input: function(input) {
    if (input) {
      this._input = input;
      return this;
    } else {
      return this._input;
    }
  },

  config: function(config) {
    if (config) {
      this._config = config;
      return this;
    } else {
      return this._config;
    }
  },

  meta: function(meta) {
    if (meta) {
      this._meta = meta;
      return this;
    } else {
      return this._meta;
    }
  },

  // reset selected route variant
  resetRouteVariant: function(request) {
    var routeState = this._mocker.state.routeState(request)[this.id()] = {};
    var variants = this.variants();
    for (var i=0; i<variants.length; i++) {
      routeState._activeVariant = variants[i].id();
      break;
    }
  },

  resetSelectedInput: function(request) {
    var rootInput = this._mocker.state.routeState(request)[this.id()];
    if (!rootInput) {
      this._mocker.state.routeState(request)[this.id()] = {};
      rootInput = this._mocker.state.routeState(request)[this.id()];
    }
    var selectedRouteInput = rootInput._input = {};
    rootInput._variantInput = {};
    var route = this;

    function setDefaultValue(key, data, obj) {
      var value = _.isFunction(data.defaultValue) ? data.defaultValue.call(executionContext(route, request)) : data.defaultValue;
      if (value !== undefined) {
        obj[key] = value;
      }
    }

    _.each(this.input(), function(data, key) {
      setDefaultValue(key, data, selectedRouteInput);
    }, this);

    _.each(this.variants(), function(variant) {
      this.selectVariantInput({}, variant, request);
      var selectedVariantInput = this.selectedVariantInput(variant, request);
      _.each(variant.input(), function(data, key) {
        setDefaultValue(key, data, selectedVariantInput);
      }, this);
    }, this);
  },

  selectRouteInput: function(selectedInput, request) {
    var input = this._mocker.state.routeState(request);
    input[this.id()]._input = selectedInput || {};
    return this;
  },

  selectedRouteInput: function(request) {
    var input = this._mocker.state.routeState(request);
    return input[this.id()]._input;
  },

  getInputValue: function(id, request) {
    var routeInput = this.selectedRouteInput(request);
    if (!_.isUndefined(routeInput[id])) {
      return routeInput[id];
    }

    var variant = this.getActiveVariant(request);
    var variantInput = this.selectedVariantInput(variant, request);
    return variantInput[id];
  },

  selectedVariantInput: function(variant, request) {
    var input = this._mocker.state.routeState(request)[this.id()]._variantInput;
    if (!input) {
      input = this._mocker.state.routeState(request)[this.id()]._variantInput = {};
    }
    input = input[variant.id()];
    if (!input) {
      input = input[variant.id()] = {};
    }
    return input;
  },

  selectVariantInput: function(selectedInput, variant, request) {
    var input = this._mocker.state.routeState(request)[this.id()];
    input._variantInput[variant.id()] = selectedInput;
  },

  getMetaValue: function(id) {
    return this._meta && this._meta[id];
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
  var variant = route.getActiveVariant(request);
  return {
    state: function(id, value) {
      var details = {
        route: route,
        variant: variant
      }

      if (value !== undefined) {
        route._mocker.state.userState(request, details)[id] = value;
      } else {
        return route._mocker.state.userState(request, details)[id];
      }
    },
    input: function(id) {
      return route.getInputValue(id, request);
    },
    meta: function(id) {
      return route.getMetaValue(id);
    },
    route: route,
    variant: variant
  };
}
