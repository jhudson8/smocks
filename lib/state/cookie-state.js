var _ = require('lodash');

var COOKIE_STATE_KEY;
var MACHINE_ID = Math.floor(Math.random() * 1000000) + '';

var STATES = {};

function StateManager(options) {
  options = options || {};
  this.timeout = options.timeout || 8 * 60 * 60 * 1000;
  this.maxSessions = options.maxSessions || 30;
}
_.extend(StateManager.prototype, {

  initialize: function (request, callback) {
    if (!COOKIE_STATE_KEY) {
      var smocks = require('../index');
      COOKIE_STATE_KEY = '_smocks_state_' + smocks.id()
    }

    var sessionId = request.state[COOKIE_STATE_KEY];
    var doInitialize = !sessionId || !STATES[sessionId];
    if (doInitialize) {
      var newStateId = guid();
      request._smocksInitialized = newStateId;
    }
    callback(undefined, doInitialize);
  },

  onResponse: function (request, reply) {
    var newStateId = request._smocksInitialized;
    if (newStateId) {
      reply.state(COOKIE_STATE_KEY, newStateId, { encoding: 'none', clearInvalid: true, path: '/' });
    }
    reply.state('__smocks_container_id', MACHINE_ID, { encoding: 'none', clearInvalid: true, path: '/' });
    reply.state('__smocks_state', 'cookie', { encoding: 'none', clearInvalid: true, path: '/' });

    this._cleanup();
  },

  userState: function (request) {
    return this._getStateValue('userState', request);
  },

  resetUserState: function (request, initialState) {
    this._clearStateValue('userState', request, initialState);
  },

  routeState: function (request) {
    return this._getStateValue('routeState', request);
  },

  resetRouteState: function (request) {
    this._clearStateValue('routeState', request);
  },

  _getStateValue: function (key, request) {
    var state = this._getState(request);
    var rtn = state[key];
    if (!rtn) {
      state[key] = {};
      rtn = state[key];
    }
    return rtn;
  },

  _clearStateValue: function (key, request, seed) {
    var state = this._getState(request);
    state[key] = seed || {};
  },

  _getState: function (request) {
    var stateId = request._smocksInitialized || request.state[COOKIE_STATE_KEY];
    var container = STATES[stateId];
    if (!container) {
      container = {
        lastAccess: new Date().getTime(),
        state: {}
      };
      STATES[stateId] = container;
    } else {
      container.lastAccess = new Date().getTime();
    }
    return container.state;
  },

  _cleanup: function () {
    var toDelete = {};
    var statesLength = 0;
    var clearIfBefore = new Date().getTime() - this.timeout;
    _.each(STATES, function (data, token) {
      if (data.lastAccess < clearIfBefore) {
        toDelete[token] = true;
      } else {
        statesLength ++;
      }
    });
    _.each(toDelete, function (value, token) {
      delete STATES[token];
    });

    function clearLastState() {
      var leastTime = -1;
      var leastToken;
      _.each(STATES, function (data, token) {
        if (leastTime === -1 || data.lastAccess < leastTime) {
          leastTime = data.lastAccess;
          leastToken = token;
        }
      });
      if (leastToken) {
        delete STATES[leastToken];
      }
    }

    while (statesLength > this.maxSessions) {
      clearLastState();
      statesLength --;
    }
  }
});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

module.exports = StateManager;
