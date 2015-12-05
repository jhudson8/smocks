var _ = require('lodash');

var initialized = false;
var ROUTE_STATE = {};
var USER_STATE = {};

module.exports = {
  isInitialized: function() {
    return initialized;
  },

  onInitialized: function(request, reply, smocks) {
    initialized = true;
  },

  userState: function(request) {
    return USER_STATE;
  },

  resetUserState: function(request) {
    USER_STATE = {};
  },

  routeState: function(request) {
    return ROUTE_STATE;
  },

  resetRouteState: function(request) {
    ROUTE_STATE = {};
  }
};
