var _ = require('lodash');

var TOKEN = '__smocks_id';

var STATES = {};

var initialized = false;

function StateManager(options) {
  options = options || {};
  this.timeout = options.timeout || 8 * 60 * 60 * 1000;
  this.maxSessions = options.maxSessions || 30;
}
_.extend(StateManager.prototype, {
  isInitialized: function(request) {
    var sessionId = request.state[TOKEN];

    var initialized = sessionId && !!STATES[sessionId];
    if (_.isArray(initialized)) {
      initialized = undefined;
    }
    if (!initialized) {
      var newStateId = _.uniqueId('_smocks_state_');
      request._smocksInitialized = newStateId;
    }
    return initialized;
  },

  onResponse: function(request, reply) {
    var newStateId = request._smocksInitialized;
    if (newStateId) {
      reply.state(TOKEN, newStateId, { encoding: 'none', clearInvalid: true, path: '/' });
    }

    this._cleanup();
  },

  userState: function(request) {
    return this._getStateValue('userState', request);
  },

  resetUserState: function(request) {
    this._clearStateValue('userState', request);
  },

  routeState: function(request) {
    return this._getStateValue('routeState', request);
  },

  resetRouteState: function(request) {
    this._clearStateValue('routeState', request);
  },

  _getStateValue: function(key, request) {
    var state = this._getState(request);
    var rtn = state[key];
    if (!rtn) {
      state[key] = {};
      rtn = state[key];
    }
    return rtn;
  },

  _clearStateValue: function(key, request) {
    var state = this.getState(request);
    state[key] = {};
  },

  _getState: function(request) {
    var stateId = request._smocksInitialized || request.state[TOKEN];
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

  _cleanup: function() {
    var toDelete = {};
    var statesLength = 0;
    var clearIfBefore = new Date().getTime() - this.timeout;
    _.each(STATES, function(data, token) {
      if (data.lastAccess < clearIfBefore) {
        toDelete[token] = true;
      } else {
        statesLength ++;
      }
    });
    _.each(toDelete, function(value, token) {
      delete STATES[token];
    });

    function clearLastState() {
      var leastTime = -1;
      var leastToken;
      _.each(STATES, function(data, token) {
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

module.exports = StateManager;
