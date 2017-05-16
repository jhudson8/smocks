var smocks = require('../index');
var server = smocks('example'); // we always have to set a mock server id

// fixture demonstrating user config, handling state and multiple variants
server.route({
    id: 'counter',
    label: 'Counter and Message', // label is optional
    path: '/api/counter',
    method: 'GET', // method is optional if it is GET
    websocketId: 'countUp', // websocketId is optional will default to path option

    input: {
      countBy: {
        label: 'Count by',
        type: 'text',
        defaultValue: '1'
      }
    },

    handler: function (req, reply, _server) {
      _server.publish('/test/subscription', { message: 'From subscription', count: this.state('counter') || 0 });

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
  var countBy = this.input('countBy');
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

server.subscription('/test/subscription');

server.onWebsocketConnection(function(server, socket) {
  console.log('got a connection!!');
});

server.onWebsocketDisconnection(function(server, socket) {
  console.log('got a disconnection :(');
});

server.onWebsocketMessage(function(server, socket, message, reply) {
  console.log('got a message!', message);
  reply('Got : ' + JSON.stringify(message));
});

// now start the server
server.start({
  port: 8000,
  host: 'localhost'
}, {}, function (err) {
  if (err) {
    console.log('smocks server not started\n', err);
    process.exit(1);
  }
});
