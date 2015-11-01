var smocks = require('../index');
var Wreck = require('wreck');

smocks.plugin({
  onRequest: function(request, reply, next) {
    var proxyConfig = smocks.state.routeState(request).__proxy;
    if (proxyConfig) {
      var url = getUrl(proxyConfig, request);
      if (!url) {
        return next();
      }
      var requestErr = proxyRequest(url, request, reply);
      if (requestErr) {
        reply({error: requestErr}).code(500);
      }
      return;
    }
    next();
  }
});

function getUrl (config, request) {
  var url;
  var urlData = smocks.initOptions.proxy[config];
  if (typeof urlData === 'string') {
    url = urlData + request.path;
  } else {
    url = urlData(request);
  }
  if (!url) {
    return false;
  }

  var queryValues = [];
  for (var key in request.query) {
    if (request.query.hasOwnProperty(key)) {
      var queryVal = request.query[key];
      if (typeof queryVal === 'string') {
        queryValues.push({key: key, value: queryVal});
      } else if (Array.isArray(queryValues)) {
        for (var i=0; i<queryValues.length; i++) {
          queryValues.push({key: key, value: queryValues[i]});
        }
      }
    }
  }

  var query = queryValues.map(function (val) {
    return val.key + '=' + encodeURIComponent(val.value);
  }).join('&');

  url = query ? (url + '?' + query) : url;
  return url;
}

function proxyRequest (url, request, reply) {
  var method = request.method || 'GET';
  var urlMatch = /^(https?)\:\/\/([^\/]+):?([0-9]*)(\/.*)$/;
  var match = url.match(urlMatch);
  if (!match) {
    return 'proxy URL must be fully qualified: ' + settings.path;
  }

  var protocol = match[1];
  var host = match[2];
  var port = parseInt(match[3] || '0', 10);
  var path = match[4];
  port = port || protocol === 'http' ? 80 : 443;

  var options = {
      payload: request.payload && JSON.stringify(request.payload),
      headers: request.headers,
      redirects: 1,
      timeout:   10000,
      rejectUnauthorized: false,
      downstreamRes: null
  };

  Wreck.request(method, url, options, function (error, response, body) {
    if (error) {
      return reply({
        proxyUrl: url,
        proxyMethod: method,
        proxyHeaders: request.headers,
        message: 'proxy error: ' + error.message,
        code: error.code
      }).code(500);
    }

    var _response = reply(response).hold();
    for (var key in response.headers) {
      _response.header(key, response.headers[key]);
    }
    _response.code(response.statusCode);
    _response.send();
  });
}
