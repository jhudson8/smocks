var _ = require('lodash');

var Plugin = function(data, mocker) {
  this.onRequest = data.onRequest;
  this.onResponse = data.onResponse;
  this.plugin = data.plugin;
  this._config = data.config;
  this._id = data.id || _.uniqueId('plugin');
  this._selectedConfig = {};
};
_.extend(Plugin.prototype, {

  id: function() {
    return this._id;
  },

  config: function() {
    return this._config;
  },

  selectedConfig: function() {
    return this._selectedConfig;
  }
});

module.exports = Plugin;
