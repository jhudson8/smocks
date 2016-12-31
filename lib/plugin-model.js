var _ = require('lodash');

var Plugin = function (data, smocks) {
  this.onRequest = data.onRequest;
  this.onResponse = data.onResponse;
  this.plugin = data.plugin;
  this._input = data.input;
  this._id = data.id || _.uniqueId('plugin');

  this.selectedInput = function (request) {
    var state = smocks.state.userState(request);
    var pluginState = state._pluginState = {};
    return pluginState[this._id];
  }
};
_.extend(Plugin.prototype, {

  id: function () {
    return this._id;
  },

  input: function () {
    return this._input;
  }
});

module.exports = Plugin;
