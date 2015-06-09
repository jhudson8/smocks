var STATE = {};

module.exports = {
  get: function(request) {
    return STATE;
  },

  reset: function(request) {
    STATE = {};
  }
};
