var _ = require('lodash');
var fs = require('fs');
var formatData = require('./format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    var data = request.payload;
    if (data.file) {
      var contents = JSON.parse(fs.readFileSync(data.file, {encoding: 'utf-8'}));
      var calls = extractCalls(contents);
      var harIndex = -1;

      mocker.state.userState(request)['__har'] = {
        file: data.file,
        index: harIndex,
        calls: calls
      };
    }

    reply(formatData(mocker, request));
  };
};

var urlMatch = /^[^:]*:?\/?\/?[^/]+([^\?]*)\??(.*)/;
function extractCalls(harContents) {
  var calls = _.compact(harContents.log.entries.map(function (data) {
    var type = data.response.content.mimeType;
    // we're only going to do html and json
    if (type === 'application/json') {
      var urlInfo = data.request.url.match(urlMatch);

      var rtn = {
        type: type,
        path: urlInfo[1],
        time: data.request.time,
        queryString: data.request.queryString,
        response: {
          status: data.response.status,
          headers: data.response.headers,
          content: data.response.content
        }
      }
      return rtn;
    }
  }));
  return calls;
}
