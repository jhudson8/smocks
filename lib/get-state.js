var STATE = {};

module.exports = {
  get: function() {
    return STATE;
  },

  reset: function() {
    STATE = {};
  }
};
