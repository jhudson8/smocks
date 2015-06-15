var smocks = require('smocks');

// notice the request handler methods (respondWith) methods
// The ```respondWith``` methods are just [HAPI route handlers](http://hapijs.com/api#route-handler)

/**
 * Create a route definition that will keep track of (in the state) the requests that are called for all variants
 * http://localhost:8000/api/history
 */
smocks.route({ path: '/api/history', method: 'GET' })
  // labels can be added to give a more human readable view of the route.  these are visible in the admin panel.
  .label('Use state to keep track when this API is hit')

  // add a route config (admin page input field) that we will use to indicate an attribute name in the response payload
  // this is really just a silly example used to demonstrate the usage of config values
  .config({
    // "attributeName" is arbitrary - it just represents the config key that the user input will be saved with
    attributeName: {
      label: 'What value should we save when the API is hit?',
      type: 'text',
      defaultValue: 'request'
    }
  })

  // add 3 different variants which will push a token to a "history" array that we store in state.
  // take a look at http://localhost:8000/api/history multiple times to see the history grow
  // the reset the state in the admin panel (top button) and see the history go away
  .variant('scenario 1').respondWith(historyScenario('scenario 1'))
  .variant('scenario 2').respondWith(historyScenario('scenario 2'))
  .variant('scenario 3').respondWith(historyScenario('scenario 3'))


/**
 * Create a route definition that will return a hello world-ish payload.  This demonstrates variables in a route definition.
 * http://localhost:8000/hello/whatever
 */
.route('/api/hello/{message}').label('Hello world example demonstrating dynamic route variables')
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
  .variant('500 error').respondWith(function(request, reply) {
    reply( {code: 'BAD_NEWS', message: 'Something bad happened'} ).code(500);
  })

  // wait 3 seconds and then simulate a back-end timeout with a 504
  .variant('timeout').respondWith(function(request, reply) {
    setTimeout(function() {
      reply( {code: 'TIMEOUT', message: 'Gateway timeout'} ).code(504);
    }, 3000);
  })


  /**
   * Plugins can be used to listen to every request and perform an action.  They can define
   * config values as shown below.  The following plugin adds a config parameter to the admin page
   * which will allow you to select a delay in the response.
   */
  .plugin({
    config: {
      delay: {
        label: 'Add delay to all responses',
        type: 'select',
        options: [{label: 'no delay', value: 0}, {label: '1 sec', value: 1000}, {label: '5 sec', value: 5000}],
        defaultValue: 0
      }
    },
    onRequest: function(request, reply, next) {
      // get the delay value from config
      var delay = this.config('delay');
      if (delay > 0) {
        // if there is a delay, call next after a timeout
        setTimeout(next, delay);
      } else {
        next();
      }
    }
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
    var toSet = {};
    // get the user config attribute which we'll use as the value we push on to the state
    // config values are meaningful because the user can control them using the admin panel
    toSet[scenarioName] = this.config('attributeName');
    history.push(toSet);

    reply(history);
  };
}
