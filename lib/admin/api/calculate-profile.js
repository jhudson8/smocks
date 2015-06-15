var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    reply(mocker.profiles.calculateCurrentProfile());
  };
};
