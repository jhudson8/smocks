var smocks = require('smocks');

// notice the request handler methods (respondWith) methods
// The ```respondWith``` methods are just [HAPI route handlers](http://hapijs.com/api#route-handler)

/**
 * Create a route definition that will keep track of (in the state) the requests that are called for all variants
 * http://localhost:8000/api/history
 */
smocks.route('/api/history')
  // not necessary since default is GET but just to be explicit
  .method('GET')

  // add a route config (admin page input field) that we will use to indicate an attribute name in the response payload
  // this is really just a silly example used to demonstrate the usage of config values
  .config({
    // "attributeName" is arbitrary - it just represents the config key that the user input will be saved with
    attributeName: {
      label: 'What attribute name should I use to demonstrate state?',
      type: 'text',
      defaultValue: 'history'
    }
  })

  // add 3 different variants which will push a token to a "history" array that we store in state.
  // take a look at http://localhost:8000/api/history multiple times to see the history grow
  // the reset the state in the admin panel (top button) and see the history go away
  .variant('scenario1').respondWith(historyScenario('scenario1'))
  .variant('scenario2').respondWith(historyScenario('scenario2'))
  .variant('scenario3').respondWith(historyScenario('scenario3'))


/**
 * Create a route definition that will return a hello world-ish payload.  This demonstrates variables in a route definition.
 * http://localhost:8000/hello/whatever
 */
.route('/api/hello/{message}')
  .respondWith(function(request, reply) {
    // this is the simplest route handler we can have because we are using the default method (GET)
    // and the default variant id ("default") for this route
    reply({ hello: request.params.message });
  })


/**
 * You can also easily respond with files - and even use dynamic route variables using "respondWithFile".
 * Remember that ./ will point to the root of your project rather than the current directory (which in this case will be the same).
 * To test this route, uncomment the code below and add a file called "bar.json" in the root directory what some content.
 * Then browse to http://localhost:8000/foo/bar
 */
// .route('/foo/{something}').respondWithFile('./{something}.json')


/**
 * Global variants (can be associated with any route definitions)
 */
.global()

  // simulate a back-end server error
  .variant('500').respondWith(function(request, reply) {
    reply( {code: 'BAD_NEWS', message: 'Something bad happened'} ).code(500);
  })

  // wait 3 seconds and then simulate a back-end timeout with a 504
  .variant('timeout').respondWith(function(request, reply) {
    setTimeout(function() {
      reply( {code: 'TIMEOUT', message: 'Gateway timeout'} ).code(504);
    }, 3000);
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
function historyScenario(scenarioName) {

  // return the actual request handler (variant)
  return function(request, reply) {
    // add a state entry to indicate that we've seen "scenario1"
    // state values are meaningful because the user can reset the state to go back to a fresh start
    var history = this.state('history') || [];
    // save the var in state (in case we just created it)
    this.state('history', history);
    history.push(scenarioName);

    // get the user config attribute which we'll use to construct the payload
    // config values are meaningful because the user can control them using the admin panel
    var attributeName = this.config('attributeName');

    // now return the view history
    var payload = {};
    payload[attributeName] = history;
    reply(payload);
  };
}
