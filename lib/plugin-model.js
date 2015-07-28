var _ = require('lodash');

var Plugin = function(data, mocker) {
  this.onRequest = data.onRequest;
  this.onResponse = data.onResponse;
  this.plugin = data.plugin;
  this._config = data.config;
  this._id = data.id || _.uniqueId('plugin');
};
_.extend(Plugin.prototype, {

  id: function() {
    return this._id;
  },

  config: function() {
    return this._config;
  },

  selectedConfig: function(request) {
    var state = smocksInstance.state.configState(request);
    var pluginState = state._pluginState = {};
    return pluginState[this._id];
  }
});

module.exports = Plugin;
