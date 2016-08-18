var _ = require('lodash');

module.exports = formatData;
module.exports.formatHar = formatHar;

function formatData(mocker, request) {
  return {
    id: mocker.id(),
    routes: formatRoutes(mocker, request),
    globalInput: formatPluginInput(mocker),
    globalInputValues: mocker.plugins.getInput(request),
    profiles: formatProfiles(mocker),
    actions: formatActions(mocker.actions.get(), mocker, request),
    har: formatHar(mocker, request),
    proxies: mocker.initOptions && mocker.initOptions.proxy && _.map(mocker.initOptions.proxy,
        function (value, key) { return key; }),
    selectedProxy: mocker.state.routeState(request).__proxy
  };
}

function formatHar(mocker, request) {
  var harData = mocker.state.userState(request)['__har'];
  if (harData) {
    return {
      startIndex: harData.startIndex,
      fileName: harData.fileName,
      minTime: harData.minTime,
      maxTime: harData.maxTime,
      calls: harData.calls.map(function(call) {
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

function formatProfiles(mocker) {
  var rtn = [];
  var profiles = mocker.profiles.get();
  _.each(profiles, function(data, id) {
    rtn.push(id);
  });
  return rtn;
}

function formatPluginInput(mocker) {
  var rtn = [];
  var plugins = mocker.plugins.get();
  _.each(plugins, function(plugin) {
    if (plugin.input) {
      rtn.push({
        id: plugin.id(),
        input: plugin.input()
      });
    }
  });
  return rtn;
}

function formatRoutes(mocker, request) {
  var routes = mocker.routes.get();
  return _.compact(_.map(routes, function(route) {
    if (!route.hasVariants()) {
      return undefined;
    }

    return {
      id: route.id(),
      path: route.path(),
      group: route.group(),
      method: route.method(),
      label: route.label(),
      display: route.getDisplayValue(request),
      variants: formatVariants(route, mocker, request),
      actions: formatActions(route.actions.get(), mocker, request),
      input: formatInput(route.input(), mocker),
      selections: formatSelections(route, request),
      activeVariant: route.activeVariant(request)
    };
  }));
}

function formatSelections(route, request) {
  var variantSelections = {};
  _.each(route.variants(), function(variant) {
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

function formatActions(actions, mocker, request) {
  var rtn = [];
  _.each(actions, function(action, id) {
    rtn.push({
      id: id,
      label: action.label,
      input: formatInput(action.input, mocker, request)
    });
  });
  return rtn;
}

function formatVariants(route, mocker, request, type) {
  return _.map(route.variants(), function(variant) {
    return {
      id: variant.id(),
      label: variant.label(),
      input: formatInput(variant.input(), mocker, request)
    };
  });
}

function formatInput(input, mocker, request) {
  var rtn = {};
  _.each(input, function(data, key) {
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
