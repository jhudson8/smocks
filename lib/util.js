module.exports = {
  executionContext: executionContext
};

function executionContext (options, func, self) {
  var request = options.request;
  var route = options.route;
  var action = options.action;
  var plugin = options.plugin;
  var smocks = options.smocks;
  var variant = route && route.getActiveVariant(request);

  var details = {
    route: route,
    variant: variant
  };

  var context = {
    state: function (id, value) {
      if (value !== undefined) {
        smocks.state.userState(request, details)[id] = value;
      } else if (id) {
        return smocks.state.userState(request, details)[id];
      } else {
        return smocks.state;
      }
    },
    input: function (id) {
      if (plugin) {
        return smocks.plugins.getInputValue(plugin.id(), id, request);
      }
      return route && route.getInputValue(id, request);
    },
    pluginInput: function (pluginId, id) {
      return options.smocks.plugins.getInputValue(pluginId, id, request);
    },
    meta: function (id) {
      return route && route.getMetaValue(id);
    },
    options: smocks.inputOptions,
    route: route,
    action: action,
    variant: variant
  };

  // execute the function with the context
  var rtn;
  var __index = require('./index');
  try {
    __index.context = context;
    rtn = func.call(self || this, context);
  } finally {
    delete __index.context;
  }
  return rtn;
}
