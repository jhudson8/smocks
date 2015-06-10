var smock = require('smocks');

smock.route('/api/foo')
  // not necessary since default is GET but just to be explicit
  .method('GET')
  .config({
    attributeName: {
      label: 'What attribute name should I use to demonstrate state?',
      type: 'text',
      defaultValue: 'history'
    }
  })

  .variant('scenario1').onRequest(fooScenario('scenario1'))
  .variant('scenario2').onRequest(fooScenario('scenario2'))
  .variant('scenario3').onRequest(fooScenario('scenario3'))


.route('/api/bar')
  .onRequest(function(request, reply) {
    // this is the simplest route handler we can have because we are using the default method (GET)
    // and the default variant id ("default") for this route
    reply({foo: 'bar'});
  })


.global()
  .variant('500').onRequest(function(request, reply) {
    // since this is a global variant, it can be selected as the active variant for any route
    // we are testing a 500 server error scenario here
    reply({code: 'BAD_NEWS', message: 'Something bad happened'}).code(500);
  })

.start({
    host: 'localhost',
    port: 8000
});


/**
 * Return a request handler scoped to a specific scenario name
 *
 * We will simply rstore the user's scenario request history (can be changed by altering the variants in the admin panel).
 */
function fooScenario(scenarioName) {
  // return the actual request handler (variant)
  return function(request, reply) {
    // add a state entry to indicate that we've seen "scenario1"
    // state values are meaningful because the user can reset the state to go back to a fresh start
    var history = this.state('history') || [];
    this.state('history', history);
    history.push(scenarioName);

    // get the user config attribute which we'll use to construct the payload
    // config values are meaningful because the user can control them using the admin panel
    var attributeName = this.config('attributeName');

    // not return the view history
    var payload = {};
    payload[attributeName] = history;
    reply(payload);
  };
}
