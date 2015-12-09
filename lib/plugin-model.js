var _ = require('lodash');

var Plugin = function(data, mocker) {
  this.onRequest = data.onRequest;
  this.onResponse = data.onResponse;
  this.plugin = data.plugin;
  this._input = data.input;
  this._id = data.id || _.uniqueId('plugin');
};
_.extend(Plugin.prototype, {

  id: function() {
    return this._id;
  },

  input: function() {
    return this._input;
  },

  selectedInput: function(request) {
    var state = smocksInstance.state.userState(request);
    var pluginState = state._pluginState = {};
    return pluginState[this._id];
  }
});

module.exports = Plugin;
