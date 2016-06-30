var _ = require('lodash');

var doInitialize = true;
var ROUTE_STATE = {};
var USER_STATE = {};

module.exports = {
  initialize: function(request, callback) {
    var _doInitialize = doInitialize;
    doInitialize = false;
    callback(undefined, _doInitialize);
  },

  userState: function(request) {
    return USER_STATE;
  },

  resetUserState: function(request, initialState) {
    USER_STATE = initialState;
  },

  routeState: function(request) {
    return ROUTE_STATE;
  },

  resetRouteState: function(request) {
    ROUTE_STATE = {};
  },

  onResponse: function(request, reply) {
    reply.state('__smocks_state', 'static', { encoding: 'none', clearInvalid: true, path: '/' });
  },
};
