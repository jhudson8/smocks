var _ = require('lodash');

module.exports = formatData;

function formatData(mocker, request) {
  return {
    routes: formatRoutes(mocker, request),
    variants: formatVariants(mocker.variants.get(), mocker, request, 'global'),
    globalConfig: formatPluginConfig(mocker),
    globalConfigValues: mocker.globalConfigValues || {},
    profiles: formatProfiles(mocker)
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
      variants: formatVariants(route.variants(), mocker, request),
      config: formatConfig(route, mocker),
      selections: formatSelections(route),
      activeVariant: route.activeVariant()
    };
  }));
}

function formatSelections(route) {
  var variantSelections = {};
  _.each(route.variants(), function(variant, id) {
    var config = variant.selectedConfig();
    if (!isEmptyObject(config)) {
      variantSelections[id] = config;
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

function formatVariants(variants, mocker, request, type) {
  return _.map(variants, function(variant) {
    return {
      id: variant.id(),
      routeSpecificId: type ? (type + ':' + variant.id()) : variant.id(),
      label: variant.label(),
      config: formatConfig(variant, mocker, request)
    };
  });
}

function formatConfig(obj, mocker, request) {
  var rtn = {};
  _.each(obj.config(), function(data, key) {
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
