var _ = require('lodash');
var util = require('../../util');

module.exports = formatData;
module.exports.formatHar = formatHar;

function formatData(smocks, request) {
  return util.executionContext({
    request: request,
    smocks: smocks
  }, function (context) {
    return {
      id: smocks.id(),
      routes: formatRoutes(smocks, request, context),
      globalInput: formatPluginInput(smocks, context),
      globalInputValues: smocks.plugins.getInput(request, context),
      profiles: formatProfiles(smocks, context),
      actions: formatActions(smocks.actions.get(), smocks, request, context),
      har: formatHar(smocks, request, context),
      proxies: smocks.options && smocks.options.proxy && _.map(smocks.options.proxy,
          function (value, key) { return key; }),
      selectedProxy: smocks.state.routeState(request).__proxy
    };
  });
}

function formatHar(smocks, request) {
  var harData = smocks.state.userState(request)['__har'];
  if (harData) {
    return {
      startIndex: harData.startIndex,
      fileName: harData.fileName,
      minTime: harData.minTime,
      maxTime: harData.maxTime,
      calls: harData.calls.map(function (call) {
        return {
          id: call.id,
          path: call.path,
          method: call.method,
          responded: call.responded,
          status: call.response.status,
          time: call.time,
          startTime: call.startTime
        };
      })
    };
  }
}

function formatProfiles(smocks) {
  var rtn = [];
  var profiles = smocks.profiles.get();
  _.each(profiles, function (data, id) {
    rtn.push(id);
  });
  return rtn;
}

function formatPluginInput(smocks) {
  var rtn = [];
  var plugins = smocks.plugins.get();
  _.each(plugins, function (plugin) {
    if (plugin.input) {
      rtn.push({
        id: plugin.id(),
        input: plugin.input()
      });
    }
  });
  return rtn;
}

function formatRoutes(smocks, request, context) {
  var routes = smocks.routes.get();
  return _.compact(_.map(routes, function (route) {
    if (!route.hasVariants()) {
      return undefined;
    }

    return {
      id: route.id(),
      path: route.path(),
      group: route.group(),
      method: route.method(),
      label: route.label(),
      display: route.getDisplayValue(request, context),
      variants: formatVariants(route, smocks, request),
      actions: formatActions(route.actions.get(), smocks, request),
      input: formatInput(route.input(), smocks),
      selections: formatSelections(route, request),
      activeVariant: route.activeVariant(request)
    };
  }));
}

function formatSelections(route, request) {
  var variantSelections = {};
  _.each(route.variants(), function (variant) {
    var input = route.selectedVariantInput(variant, request);
    if (!isEmptyObject(input)) {
      variantSelections[variant.id()] = input;
    }
  });
  var rtn = {};
  var input = route.selectedRouteInput(request);
  if (!isEmptyObject(input)) {
    rtn.route = input;
  }
  if (!isEmptyObject(variantSelections)) {
    rtn.variants = variantSelections;
  }
  if (!isEmptyObject(rtn)) {
    return rtn;
  }
}

function formatActions(actions, smocks, request) {
  var rtn = [];
  _.each(actions, function (action, id) {
    rtn.push({
      id: id,
      label: action.label,
      input: formatInput(action.input, smocks, request)
    });
  });
  return rtn;
}

function formatVariants(route, smocks, request, type) {
  return _.map(route.variants(), function (variant) {
    return {
      id: variant.id(),
      label: variant.label(),
      input: formatInput(variant.input(), smocks, request)
    };
  });
}

function formatInput(input, smocks, request) {
  var rtn = {};
  _.each(input, function (data, key) {
    rtn[key] = _.clone(data);
    rtn[key].id = key;
  });
  return rtn;
}

function isEmptyObject(obj) {
  for (var name in obj) {
    if (obj.hasOwnProperty(name)) {
      return false;
    }
  }
  return true;
}
