var _ = require('lodash');

module.exports = formatData;

function formatData(mocker, request) {
  return {
    routes: formatRoutes(mocker, request),
    globalConfig: formatPluginConfig(mocker),
    globalConfigValues: mocker.globalConfigValues || {},
    profiles: formatProfiles(mocker),
    actions: formatActions(mocker.actions.get(), mocker, request)
  };
}

function formatProfiles(mocker) {
  var rtn = [];
  var profiles = mocker.profiles.get();
  _.each(profiles, function(data, id) {
    rtn.push(id);
  });
  return rtn;
}

function formatPluginConfig(mocker) {
  var rtn = [];
  var plugins = mocker.plugins.get();
  _.each(plugins, function(plugin) {
    if (plugin.config) {
      rtn.push({
        id: plugin.id(),
        config: plugin.config()
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
      method: route.method(),
      label: route.label(),
      display: route.getDisplayValue(request),
      variants: formatVariants(route, mocker, request),
      actions: formatActions(route.actions.get(), mocker, request),
      config: formatConfig(route.config(), mocker),
      selections: formatSelections(route),
      activeVariant: route.activeVariant()
    };
  }));
}

function formatSelections(route) {
  var variantSelections = {};
  _.each(route.variants(), function(variant) {
    var config = variant.selectedConfig(route);
    if (!isEmptyObject(config)) {
      variantSelections[variant.id()] = config;
    }
  });
  var rtn = {};
  var config = route.selectedConfig();
  if (!isEmptyObject(config)) {
    rtn.route = config;
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
      config: formatConfig(action.config, mocker, request)
    });
  });
  return rtn;
}

function formatVariants(route, mocker, request, type) {
  return _.map(route.variants(), function(variant) {
    return {
      id: variant.id(),
      label: variant.label(),
      config: formatConfig(variant.config(), mocker, request)
    };
  });
}

function formatConfig(config, mocker, request) {
  var rtn = {};
  _.each(config, function(data, key) {
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
