var Wreck = require('wreck');
var _ = require('lodash');
var expect = require('chai').expect;
var staticState = require('../../lib/state/static-state');

module.exports = {
  beforeEach: beforeEach,
  afterEach: afterEach
};

function beforeEach (server, context, done) {
  function onDone () {
    context.evalRequest = function (path, options, callback) {
      if (!callback) {
        callback = options;
        options = path;
      } else {
        options = _.extend({
          path: path
        }, options);
      }

      expectRequest(options, wrapCallback(callback, context));
    };

    context.evalRequests = function (arr, callback) {
      return evalRequests(arr, wrapCallback(callback, context));
    };

    context.useVariant = useVariant;
    context.setRouteInput = setRouteInput;
    context.waterfall = waterfall;
    done();
  }

  if (server) {
    context._server = server;
    server.start({
      port: 7999,
      host: 'localhost'
    }, {
      state: staticState.new()
    }, onDone);
  } else {
    onDone();
  }
}

function afterEach (done) {
  if (this._server) {
    this._server.stop(function(err) {
      if (err) {
        console.log(err);
        done(err);
      } else {
        done();
      }
    });
  } else {
    done();
  }
}

function wrapCallback (callback, context) {
  return function () {
    callback && callback.apply(context, arguments);
  };
}

function useVariant (routeId, variantId, callback, done) {
  var context = this;
  var options = {
    payload: JSON.stringify({
      variant: variantId
    })
  };
  Wreck.post('http://localhost:7999/_admin/api/route/' + routeId, options, function (err) {
    if (err) {
      return done(err);
    }
    callback.call(context);
  });
}

function setRouteInput (routeId, input, callback, done) {
  var context = this;
  var options = {
    payload: JSON.stringify({
      input: {
        route: input
      }
    })
  };
  Wreck.post('http://localhost:7999/_admin/api/route/' + routeId, options, function (err) {
    if (err) {
      return done(err);
    }
    callback.call(context);
  });
}

function expectRequest (options, callback) {
  request(options, function (err, res, payload) {
    if (err) {
      return callback(err);
    }
    evalRequest(options, res, payload, wrapCallback(callback, this));
  });
}

function evalRequest (options, res, payload, callback) {
  try {
    payload = JSON.parse(payload.toString('utf8'));
  } catch (e) {
    payload = '';
  }

  log(payload || '(empty)');
  var expectBody = options.expect;

  if (typeof expectBody === 'function') {
    expectBody(payload, res);
    return callback();
  }

  var code = 0;
  var expectAttributes;
  if (expectBody && (expectBody.code || expectBody.attributes)) {
    code = expectBody.code;
    expectAttributes = expectBody.attributes;
    expectBody = expectBody.body;
  }

  if (expectBody) {
    try {
      if (typeof expectBody === 'function') {
        expectBody(payload, res.statusCode);
      } else {
        expect(payload).to.eql(expectBody);
      }
    } catch (e) {
      console.log(e);
      console.log(JSON.stringify(payload));
      throw e;
    }
  }

  if (code) {
    expect(code).to.equal(res.statusCode);
  }

  if (expectAttributes) {
    for (var key in expectAttributes) {
      if (expectAttributes.hasOwnProperty(key)) {
        expectAttribute(key, expectAttributes[key], payload);
      }
    }
  }

  callback();
}

function expectAttribute (key, expectValue, payload) {
  var parts = key.split('.');
  var value = payload[parts[0]];
  for (var i = 1; i < parts.length && typeof root !== 'undefined'; i++) {
    value = value[parts[i]];
  }
  expect(value).to.eql(expectValue);
}

function request (options, callback) {
  var uri = 'http://localhost:7999' + options.path;
  var _options = {
    payload: options.payload && JSON.stringify(options.payload)
  };
  log('\n\nREQUEST ', uri, ' (', options.method || 'GET', ')');
  Wreck[(options.method || 'get').toLowerCase()](uri, _options, callback);
}

function evalRequests (arr, callback) {
  var max = arr.length - 1;
  var index = 0;
  function _callback (err, req, payload) {
    if (err) {
      return callback(err);
    }

    if (index === max) {
      expectRequest.call(this, arr[index++], callback);
    } else {
      expectRequest.call(this, arr[index++], _callback);
    }
  }
  _callback();
}

function waterfall (arr, done) {
  var context = this;
  var index = 0;
  function doIt (err) {
    if (err) {
      return done(err);
    }
    var exec = arr[index];
    if (!exec) {
      return done();
    }
    index = index + 1;
    exec.call(context, doIt);
  }
  doIt();
}

function log () {
  if (global.debug) {
    console.log.apply(console, arguments);
  }
}
