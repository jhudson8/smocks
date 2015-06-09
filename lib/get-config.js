var CONFIG = {};

module.exports = {
  get: function(fixture) {
    return CONFIG[fixture.path] || {};
  },

  reset: function(fixture) {
    CONFIG[fixture.path] = {};
  }
};
