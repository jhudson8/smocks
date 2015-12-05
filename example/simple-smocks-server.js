var smocks = require('../lib');

// we always have to set a mock server id
smocks.id('example');

// fixture demonstrating user config, handling state and multiple variants
smocks.route({
    id: 'counter',
    label: 'Counter and Message', // label is optional
    path: '/api/counter',
    method: 'GET', // method is optional if it is GET

    config: {
      countBy: {
        label: 'Count by',
        type: 'text',
        defaultValue: '1'
      }
    },

    handler: function (req, reply) {
    // routes can have a default handler but do not have to
      respond.call(this, 'default message', reply);
    }
  })

  // add a separate handler for this fixture
  .variant({
    id: 'hello_world',
    label: 'hello world',
    handler: function (req, reply) {
      respond.call(this, 'hello world', reply);
    }
  })

  // and we can have as many variants as we want
  .variant({
    id: 'hello_universe',
    label: 'hello universe',
    handler: function (req, reply) {
      respond.call(this, 'hello universe', reply);
    }
  });

function respond (message, reply) {
  // context is "this" from the route handler

  // this is how you get the user config value
  var countBy = this.config('countBy');
  countBy = parseInt(countBy, 10) || 1;

  // this is how you get state values
  var count = this.state('counter') || 0;
  count = count + countBy;

  // this is how you set a state value
  this.state('counter', count);

  reply({
    message: message,
    count: count
  });
}

// now start the server
require('smocks/hapi').start({
  port: 8000,
  host: 'localhost'
});
